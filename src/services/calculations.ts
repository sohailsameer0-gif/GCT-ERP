import {
  AttendanceRecord,
  AttendanceStatus,
  ERPState,
  Teacher,
  TimetableSlot,
} from '../types/erp';

export function uid(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function escapeHtml(str: any): string {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => {
    return (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[c] || c
    );
  });
}

export function timeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const parts = String(t).split(':');
  return Number(parts[0]) * 60 + Number(parts[1] || 0);
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatDate(d: string | undefined): string {
  if (!d) return '—';
  const t = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  if (isNaN(t.getTime())) return '—';
  return t.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(d: string | undefined): string {
  if (!d) return '—';
  const t = new Date(d);
  if (isNaN(t.getTime())) return '—';
  return t.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatTime(d: string | undefined): string {
  if (!d) return '—';
  if (d.includes(':') && d.length <= 5) return d;
  const t = new Date(d);
  if (isNaN(t.getTime())) return '—';
  return t.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getDayOfWeek(d: Date | string = new Date()): string {
  const dateObj = typeof d === 'string' ? new Date(`${d}T00:00:00`) : d;
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dateObj.getDay()
  ];
}

export function cleanMobile(m: string): string {
  const d = String(m || '').replace(/\D/g, '');
  if (d.startsWith('92')) return d;
  if (d.startsWith('0')) return `92${d.slice(1)}`;
  if (d.length === 10) return `92${d}`;
  return d;
}

export function waLink(mobile: string, message: string = ''): string | null {
  const m = cleanMobile(mobile);
  if (!m) return null;
  return `https://wa.me/${m}?text=${encodeURIComponent(message)}`;
}

export function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export function getDeviceFingerprint(): string {
  const FP_KEY = 'gct_device_fp';
  let fp: string | null = null;
  try {
    fp = localStorage.getItem(FP_KEY);
  } catch (e) {}
  if (!fp) {
    const parts = [
      navigator.userAgent || '',
      navigator.language || '',
      `${screen.width}x${screen.height}`,
      String(new Date().getTimezoneOffset()),
      String(navigator.hardwareConcurrency || 0),
    ];
    fp = `fp_${simpleHash(parts.join('|'))}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      localStorage.setItem(FP_KEY, fp);
    } catch (e) {}
  }
  return fp;
}

export function secureToken(): string {
  // Short 4-character uppercase alphanumeric code (easy for students to punch in or scan)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  const b = new Uint8Array(4);
  try {
    window.crypto.getRandomValues(b);
  } catch (e) {
    for (let i = 0; i < 4; i++) b[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 4; i++) {
    token += chars[b[i] % chars.length];
  }
  return token;
}

export interface AttendanceSummaryResult {
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  rawPercentage: number;
  converted: number;
  adjustedPercentage: number;
  isShortage: boolean;
}

/**
 * Calculates student attendance statistics adhering to GCT Peshawar rules:
 * - Each 3 late marks count as 1 absence (or configurable threshold)
 * - Approved leaves are discounted or exempted
 * - Shortage threshold defaults to 70%
 */
export function calculateAttendanceSummary(
  studentId: string,
  state: ERPState,
  courseId?: string
): AttendanceSummaryResult {
  const shortageThreshold = state.settings.shortageThreshold ?? 70;
  const lateToAbsenceThreshold = state.settings.lateToAbsenceThreshold ?? 3;

  const records = state.attendanceRecords.filter((r) => {
    if (r.studentId !== studentId) return false;
    if (courseId && r.courseId !== courseId) return false;
    return true;
  });

  let present = 0;
  let late = 0;
  let absent = 0;
  let leave = 0;

  records.forEach((r) => {
    if (r.status === 'present') present++;
    else if (r.status === 'late') late++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'approved_leave') leave++;
  });

  const total = present + late + absent + leave;

  if (total === 0) {
    return {
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      rawPercentage: 100,
      converted: 0,
      adjustedPercentage: 100,
      isShortage: false,
    };
  }

  // Raw attendance percentage
  const effectivePresent = present + late;
  const rawPercentage = (effectivePresent / total) * 100;

  // Lates conversion to absences
  const converted = Math.floor(late / lateToAbsenceThreshold);
  const adjustedPresent = Math.max(0, present + (late - converted));
  const denominator = total - leave > 0 ? total - leave : total;
  const adjustedPercentage = Math.min(100, Math.max(0, (adjustedPresent / denominator) * 100));

  return {
    total,
    present,
    late,
    absent,
    leave,
    rawPercentage: Number(rawPercentage.toFixed(1)),
    converted,
    adjustedPercentage: Number(adjustedPercentage.toFixed(1)),
    isShortage: adjustedPercentage < shortageThreshold,
  };
}

/**
 * Finds eligible substitute teachers for a slot without schedule collisions
 */
export function findEligibleSubstitutes(
  timetableId: string,
  dateIso: string,
  state: ERPState
): Teacher[] {
  const slot = state.timetable.find((t) => t.id === timetableId);
  if (!slot) return [];
  const day = slot.day;

  return state.teachers.filter((t) => {
    if (t.id === slot.teacherId) return false;
    if (!t.active) return false;
    if (t.programId && slot.programId && t.programId !== slot.programId) return false;

    // Check timetable conflict
    const busy = state.timetable.some((other) => {
      if (other.id === slot.id || other.day !== day || other.teacherId !== t.id) return false;
      return (
        timeToMinutes(slot.startTime) < timeToMinutes(other.endTime) &&
        timeToMinutes(slot.endTime) > timeToMinutes(other.startTime)
      );
    });
    if (busy) return false;

    // Check approved teacher leave
    const onLeave = state.teacherLeaveApplications.some((l) => {
      return (
        l.teacherId === t.id &&
        l.status === 'approved' &&
        dateIso >= l.startDate &&
        dateIso <= l.endDate
      );
    });
    if (onLeave) return false;

    return true;
  });
}

/**
 * QR Engine Implementation (Pure JavaScript without external CDN)
 */
export const QREngine = (() => {
  const ECC_L: Record<number, number[]> = {
    1: [7, 1, 19, 0, 0],
    2: [10, 1, 34, 0, 0],
    3: [15, 1, 55, 0, 0],
    4: [20, 1, 80, 0, 0],
    5: [26, 1, 108, 0, 0],
    6: [18, 2, 68, 0, 0],
    7: [20, 2, 78, 0, 0],
    8: [24, 2, 97, 0, 0],
    9: [30, 2, 116, 0, 0],
    10: [18, 2, 68, 2, 69],
  };
  const ALIGN: Record<number, number[]> = {
    1: [],
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
  };
  const VINFO: Record<number, number> = { 7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3 };

  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  const mul = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

  function gen(deg: number): number[] {
    let p = [1];
    for (let i = 0; i < deg; i++) {
      const n = new Array(p.length + 1).fill(0);
      for (let j = 0; j < p.length; j++) {
        n[j] ^= p[j];
        n[j + 1] ^= mul(p[j], EXP[i]);
      }
      p = n;
    }
    return p;
  }

  function rs(data: number[], ecc: number): number[] {
    const g = gen(ecc);
    const r: number[] = new Array(ecc).fill(0);
    for (let d = 0; d < data.length; d++) {
      const f = data[d] ^ (r.shift() ?? 0);
      r.push(0);
      for (let i = 0; i < ecc; i++) r[i] ^= mul(g[i + 1], f);
    }
    return r;
  }

  function chooseVer(len: number): number {
    for (let v = 1; v <= 10; v++) {
      const cap = ECC_L[v][1] * ECC_L[v][2] + ECC_L[v][3] * ECC_L[v][4];
      const hb = 4 + (v >= 10 ? 16 : 8);
      if (cap * 8 - hb >= len * 8) return v;
    }
    return 10;
  }

  function encode(text: string): boolean[][] {
    const s = new TextEncoder().encode(text);
    const bytes: number[] = Array.from(s);
    const version = chooseVer(bytes.length);
    const size = 17 + version * 4;
    const bits: number[] = [];
    const push = (v: number, len: number) => {
      for (let i = len - 1; i >= 0; i--) bits.push((v >> i) & 1);
    };

    push(4, 4);
    push(bytes.length, version >= 10 ? 16 : 8);
    for (let b = 0; b < bytes.length; b++) push(bytes[b], 8);

    const ecc = ECC_L[version][0],
      n1 = ECC_L[version][1],
      d1 = ECC_L[version][2],
      n2 = ECC_L[version][3],
      d2 = ECC_L[version][4];
    const total = n1 * d1 + n2 * d2;
    const tb = total * 8;
    push(0, Math.min(4, tb - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const pad = [0xec, 0x11];
    let pi = 0;
    while (bits.length < tb) push(pad[pi++ % 2], 8);

    const dataCw: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0;
      for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      dataCw.push(v);
    }

    const blocks: { data: number[]; ecc: number[] }[] = [];
    let idx = 0;
    for (let k = 0; k < n1; k++) {
      blocks.push({ data: dataCw.slice(idx, idx + d1), ecc: [] });
      idx += d1;
    }
    for (let k2 = 0; k2 < n2; k2++) {
      blocks.push({ data: dataCw.slice(idx, idx + d2), ecc: [] });
      idx += d2;
    }
    blocks.forEach((bl) => {
      bl.ecc = rs(bl.data, ecc);
    });

    let maxD = 0;
    blocks.forEach((bl) => {
      if (bl.data.length > maxD) maxD = bl.data.length;
    });

    const finalCw: number[] = [];
    for (let ci = 0; ci < maxD; ci++) {
      blocks.forEach((bl) => {
        if (ci < bl.data.length) finalCw.push(bl.data[ci]);
      });
    }
    for (let ce = 0; ce < ecc; ce++) {
      blocks.forEach((bl) => {
        finalCw.push(bl.ecc[ce]);
      });
    }

    const m: boolean[][] = [];
    const res: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      m.push(new Array(size).fill(false));
      res.push(new Array(size).fill(false));
    }

    const setF = (x: number, y: number, v: boolean) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      m[y][x] = v;
      res[y][x] = true;
    };

    const finder = (cx: number, cy: number) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const x = cx + dx,
            y = cy + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          setF(x, y, d !== 2 && d !== 4);
        }
      }
    };

    finder(3, 3);
    finder(size - 4, 3);
    finder(3, size - 4);

    for (let ti = 8; ti < size - 8; ti++) {
      setF(ti, 6, ti % 2 === 0);
      setF(6, ti, ti % 2 === 0);
    }

    const ap = ALIGN[version];
    for (let ai = 0; ai < ap.length; ai++) {
      for (let aj = 0; aj < ap.length; aj++) {
        const ax = ap[ai],
          ay = ap[aj];
        if (
          (ax === 6 && ay === 6) ||
          (ax === 6 && ay === size - 7) ||
          (ax === size - 7 && ay === 6)
        )
          continue;
        for (let dy2 = -2; dy2 <= 2; dy2++) {
          for (let dx2 = -2; dx2 <= 2; dx2++) {
            const d2 = Math.max(Math.abs(dx2), Math.abs(dy2));
            setF(ax + dx2, ay + dy2, d2 !== 1);
          }
        }
      }
    }

    const fd = (1 << 3) | 0;
    let fv = fd << 10;
    for (let fi = 14; fi >= 10; fi--) if ((fv >> fi) & 1) fv ^= 0x537 << (fi - 10);
    fv = ((fd << 10) | fv) ^ 0x5412;

    const fb: number[] = [];
    for (let fi2 = 14; fi2 >= 0; fi2--) fb.push((fv >> fi2) & 1);
    const fp = [
      [0, 8],
      [1, 8],
      [2, 8],
      [3, 8],
      [4, 8],
      [5, 8],
      [7, 8],
      [8, 8],
      [8, 7],
      [8, 5],
      [8, 4],
      [8, 3],
      [8, 2],
      [8, 1],
      [8, 0],
    ];
    for (let pi2 = 0; pi2 < 15; pi2++) {
      const px = fp[pi2][0],
        py = fp[pi2][1];
      setF(px, py, fb[pi2] === 1);
      setF(size - 1 - px, size - 1 - py, fb[pi2] === 1);
    }
    setF(8, size - 8, true);

    if (version >= 7) {
      const vi = VINFO[version];
      for (let vii = 0; vii < 18; vii++) {
        const bit = ((vi >> vii) & 1) === 1;
        setF(size - 11 + (vii % 3), Math.floor(vii / 3), bit);
        setF(Math.floor(vii / 3), size - 11 + (vii % 3), bit);
      }
    }

    let bitIdx = 0;
    const totalDB = finalCw.length * 8;
    let up = true;
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let ri = 0; ri < size; ri++) {
        const y2 = up ? size - 1 - ri : ri;
        for (let dx3 = 0; dx3 < 2; dx3++) {
          const x2 = col - dx3;
          if (res[y2][x2]) continue;
          let bit2 = false;
          if (bitIdx < totalDB) {
            const b2 = finalCw[bitIdx >> 3];
            bit2 = ((b2 >> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          if ((x2 + y2) % 2 === 0) bit2 = !bit2;
          m[y2][x2] = bit2;
        }
      }
      up = !up;
    }
    return m;
  }

  function drawToCanvas(canvas: HTMLCanvasElement, text: string): boolean {
    try {
      const m = encode(text);
      const size = m.length;
      const scale = Math.max(2, Math.floor(canvas.width / size));
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f172a';
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (m[y][x]) ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
      return true;
    } catch (e) {
      console.error('QR draw error', e);
      return false;
    }
  }

  return { encode, drawToCanvas };
})();

/**
 * Letterhead print window generator
 */
export function openPrintDocument(title: string, contentHtml: string): void {
  try {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (win) {
      win.document.open();
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} — GCT Peshawar</title>
            <style>
              body { font-family: 'DM Sans', system-ui, sans-serif; padding: 32px; color: #1e293b; }
              .header-seal { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
              .header-seal h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
              .header-seal h2 { margin: 4px 0; font-size: 13px; font-weight: 600; color: #475569; }
              .header-seal p { margin: 2px 0 0; font-size: 11px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
              th { background: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 10px; }
              .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header-seal">
              <h1>GOVERNMENT COLLEGE OF TECHNOLOGY PESHAWAR</h1>
              <h2>Affiliated with University of Engineering and Technology (UET) Peshawar</h2>
              <p>Kohat Road, Peshawar, Khyber Pakhtunkhwa · Official Examination & Attendance Record</p>
            </div>
            ${contentHtml}
            <div class="footer">
              <div>Printed on: ${new Date().toLocaleString()}</div>
              <div>Authorized Signatory / Department Stamp</div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      win.document.close();
      return;
    }
  } catch (e) {
    console.warn('Popup blocked, using hidden iframe print fallback:', e);
  }

  // Hidden iframe print fallback for environments where popups are blocked
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} — GCT Peshawar</title>
          <style>
            body { font-family: 'DM Sans', system-ui, sans-serif; padding: 24px; color: #1e293b; }
            .header-seal { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .header-seal h1 { margin: 0; font-size: 18px; font-weight: 800; }
            .header-seal h2 { margin: 4px 0; font-size: 12px; font-weight: 600; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header-seal">
            <h1>GOVERNMENT COLLEGE OF TECHNOLOGY PESHAWAR</h1>
            <h2>Affiliated with University of Engineering and Technology (UET) Peshawar</h2>
          </div>
          ${contentHtml}
        </body>
      </html>
    `);
    doc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {}
    }, 2000);
  }
}
