import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DoorOpen,
  Play,
  Printer,
  QrCode,
  RefreshCw,
  Send,
  Square,
  Users,
  Check,
  X,
  ShieldCheck,
  Radio,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Copy,
  Sparkles,
  UserCheck,
  Info,
  Camera,
  CameraOff,
  Upload,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import {
  formatDate,
  formatDateTime,
  getDayOfWeek,
  openPrintDocument,
  QREngine,
  todayIso,
} from '../services/calculations';
import { AttendanceSession } from '../types/erp';

interface QRAttendanceViewProps {
  mode?: 'start' | 'scan' | 'monitor';
}

export const QRAttendanceView: React.FC<QRAttendanceViewProps> = ({ mode = 'start' }) => {
  const {
    state,
    session,
    startClassSession,
    closeClassSession,
    rotateQrToken,
    scanQr,
    punchOutQr,
    requestLateScan,
    decideLateScan,
    addToast,
  } = useERP();

  const [qrInputToken, setQrInputToken] = useState('');
  const [lateReason, setLateReason] = useState('');
  const [showLateModal, setShowLateModal] = useState(false);
  const [isProjectorModalOpen, setIsProjectorModalOpen] = useState(false);
  const [monitorTab, setMonitorTab] = useState<'radar' | 'clearance'>('radar');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Manual class launcher state
  const [selectedLaunchSlot, setSelectedLaunchSlot] = useState<string>(state.timetable[0]?.id || '');
  const [selectedLaunchCourse, setSelectedLaunchCourse] = useState<string>(state.courses[0]?.id || '');
  const [selectedLaunchSection, setSelectedLaunchSection] = useState<string>(state.sections[0]?.id || '');

  // Auto-countdown timer for token rotation
  const [secondsUntilRotate, setSecondsUntilRotate] = useState<number>(30);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const projectorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const today = todayIso();
  const dayName = getDayOfWeek(new Date());

  const isTeacher = session?.role === 'teacher';
  const isStudent = session?.role === 'student';
  const isChairmanOrHOD = ['chairman', 'hod', 'sysadmin'].includes(session?.role || '');

  // Resolve current student if role is student
  const currentStudent = isStudent
    ? state.students.find(
        (s) => s.id === session?.linkedId || s.email.toLowerCase() === session?.email.toLowerCase()
      )
    : null;

  // Active session detection (for teacher or institutional admin) - derived directly from state
  const activeSession = state.attendanceSessions.find(
    (s) =>
      s.status === 'open' &&
      s.date === today &&
      (isChairmanOrHOD || s.teacherId === session?.linkedId || s.teacherId === session?.userId)
  ) || null;

  // Keep latest rotateQrToken reference for timer
  const rotateQrTokenRef = useRef(rotateQrToken);
  useEffect(() => {
    rotateQrTokenRef.current = rotateQrToken;
  });

  // Redraw QR code on canvas whenever token changes or projector opens
  useEffect(() => {
    if (activeSession) {
      if (canvasRef.current) {
        QREngine.drawToCanvas(canvasRef.current, activeSession.qrToken);
      }
      if (projectorCanvasRef.current) {
        QREngine.drawToCanvas(projectorCanvasRef.current, activeSession.qrToken);
      }
    }
  }, [activeSession?.qrToken, isProjectorModalOpen]);

  // Countdown timer for rotating QR token safely outside React render/reducer
  useEffect(() => {
    if (!activeSession) {
      setSecondsUntilRotate(30);
      return;
    }

    setSecondsUntilRotate(30);
    let secondsLeft = 30;

    const interval = window.setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = 30;
        setSecondsUntilRotate(30);
        rotateQrTokenRef.current(activeSession.id, true);
      } else {
        setSecondsUntilRotate(secondsLeft);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeSession?.id]);

  // Handle student scan
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInputToken.trim()) return;

    try {
      scanQr(qrInputToken.trim(), currentStudent?.id || session?.linkedId || '');
      setQrInputToken('');
      addToast('Attendance marked successfully!', 'success');
    } catch (e: any) {
      addToast(e.message || 'QR Scan Failed', 'error');
    }
  };

  // Instant 1-click punch-in for active class detected
  const handleInstantPunchIn = (token: string) => {
    try {
      scanQr(token, currentStudent?.id || session?.linkedId || '');
      addToast('Punch-in verified! Attendance recorded.', 'success');
    } catch (e: any) {
      addToast(e.message || 'Punch-in failed', 'error');
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported by your current browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      scanVideoFrames();
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission was denied.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanVideoFrames = () => {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (!BarcodeDetectorClass) return;

    try {
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      let active = true;

      const loop = async () => {
        if (!active || !videoRef.current || videoRef.current.readyState < 2) {
          if (active) requestAnimationFrame(loop);
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const rawVal = codes[0].rawValue;
            if (rawVal) {
              active = false;
              stopCamera();
              handleInstantPunchIn(rawVal);
              return;
            }
          }
        } catch (e) {}

        if (active) requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    } catch (e) {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const img = new Image();
      img.onload = async () => {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        if (BarcodeDetectorClass) {
          try {
            const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
            const codes = await detector.detect(img);
            if (codes && codes.length > 0) {
              handleInstantPunchIn(codes[0].rawValue);
              return;
            }
          } catch (err) {}
        }
        addToast('Could not auto-detect QR code in image. Please punch in the 4-character code.', 'warn');
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Teacher simulation: instantly punches in student Kashif Ali for quick testing
  const handleSimulateStudentScan = () => {
    if (!activeSession) return;
    const testStudent = state.students.find(
      (s) => s.currentSectionId === activeSession.sectionId || s.id === 'stu_demo_1'
    ) || state.students[0];

    try {
      scanQr(activeSession.qrToken, testStudent.id);
      addToast(`Simulated punch-in for ${testStudent.name} (${testStudent.admissionNumber})!`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Simulation error', 'info');
    }
  };

  const handlePunchOut = () => {
    try {
      punchOutQr(currentStudent?.id || session?.linkedId || '');
      addToast('Gate exit recorded', 'info');
    } catch (e: any) {
      addToast(e.message || 'Punch out failed', 'error');
    }
  };

  const handleRequestLate = () => {
    if (!lateReason.trim()) return;
    try {
      requestLateScan(lateReason);
      setShowLateModal(false);
      setLateReason('');
      addToast('Late clearance request dispatched to Chairman', 'success');
    } catch (e: any) {
      addToast(e.message || 'Request failed', 'error');
    }
  };

  const handleCopyToken = () => {
    if (!activeSession) return;
    navigator.clipboard?.writeText(activeSession.qrToken);
    addToast('Token copied to clipboard!', 'info');
  };

  const handlePrintCard = () => {
    if (!activeSession) return;
    const course = state.courses.find((c) => c.id === activeSession.courseId);
    const content = `
      <div style="text-align: center; padding: 24px; font-family: Arial, sans-serif;">
        <h2 style="margin: 0; font-size: 20px;">GOVERNMENT COLLEGE OF TECHNOLOGY PESHAWAR</h2>
        <p style="margin: 4px 0 16px; font-size: 13px; color: #475569;">Official Attendance QR Code Terminal</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
          <tr><td style="padding: 6px 0;"><strong>Course:</strong></td><td>${course?.code} — ${course?.name}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Scheduled:</strong></td><td>${activeSession.scheduledStart} – ${activeSession.scheduledEnd}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Classroom:</strong></td><td>${activeSession.className || 'General Hall'}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Date:</strong></td><td>${formatDate(activeSession.date)}</td></tr>
        </table>
        <div style="display: inline-block; padding: 16px; border: 2px dashed #0f172a; border-radius: 12px; margin: 16px 0;">
          <p style="font-family: monospace; font-size: 20px; font-weight: bold; margin: 0;">${activeSession.qrToken}</p>
        </div>
        <p style="font-size: 11px; color: #64748b;">Scan via student portal to record presence.</p>
      </div>
    `;
    openPrintDocument('Class Attendance QR', content);
  };

  // Attendees for the currently active session
  const currentSessionAttendees = activeSession
    ? state.attendanceRecords.filter((r) => r.sessionId === activeSession.id)
    : [];

  // Active session detected for student terminal
  const activeSessionForStudent = state.attendanceSessions.find(
    (s) =>
      s.status === 'open' &&
      s.date === today &&
      (s.sectionId === currentStudent?.currentSectionId || !s.sectionId)
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            {mode === 'start'
              ? 'Class Attendance & Live QR Terminal'
              : mode === 'scan'
              ? 'Student QR Attendance Terminal'
              : 'Live Classroom Attendance Radar'}
          </h1>
          <p className="text-xs text-slate-500">
            Government College of Technology Peshawar real-time attendance verification engine
          </p>
        </div>

        {mode === 'start' && activeSession && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProjectorModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Maximize2 size={14} />
              <span>Projector View</span>
            </button>
            <button
              type="button"
              onClick={() => closeClassSession(activeSession.id)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Square size={14} />
              <span>End Session</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. TEACHER QR GENERATOR VIEW                                   */}
      {/* ============================================================== */}
      {mode === 'start' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Session Display */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col items-center text-center">
              {activeSession ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Class Session Active Now
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrintCard}
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Print Official Card"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => rotateQrToken(activeSession.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Rotate Token"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* QR Canvas Display */}
                  <div className="p-5 bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-3xl border-2 border-indigo-100 inline-block shadow-sm relative group">
                    <canvas
                      ref={canvasRef}
                      width={260}
                      height={260}
                      className="rounded-2xl mx-auto shadow-sm bg-white p-2 border border-slate-200/80"
                    />
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                      <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-700">
                        Dynamic Encrypted Token
                      </span>
                    </div>
                  </div>

                  {/* Token Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-2.5 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-md border border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quick Code:</span>
                        <span className="font-mono text-2xl font-black tracking-widest text-amber-400 select-all">
                          {activeSession.qrToken}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        title="Copy Quick Code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Clock size={13} className="text-amber-500" />
                      <span>
                        Rotating in <strong>{secondsUntilRotate}s</strong> · Short 4-character code for quick punch-in
                      </span>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => rotateQrToken(activeSession.id)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={14} />
                      <span>Rotate Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateStudentScan}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      <UserCheck size={14} />
                      <span>Test Scan (Kashif Ali)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => closeClassSession(activeSession.id)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Square size={14} />
                      <span>End Class</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 space-y-4 w-full">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <QrCode size={34} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">No Class Session Currently Active</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Choose a course from your weekly timetable or launch a fast session below to generate the live QR attendance code.
                    </p>
                  </div>

                  {/* Fast 1-Click Class Launcher Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 text-left space-y-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>Quick Class Launcher</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Subject</label>
                        <select
                          value={selectedLaunchCourse}
                          onChange={(e) => setSelectedLaunchCourse(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                        >
                          {state.courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} — {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Section</label>
                        <select
                          value={selectedLaunchSection}
                          onChange={(e) => setSelectedLaunchSection(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                        >
                          {state.sections.map((s) => (
                            <option key={s.id} value={s.id}>
                              Section {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startClassSession(selectedLaunchCourse)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Play size={14} />
                      <span>Start Class & Generate QR Code</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Timetable Slots for Teacher */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Your Assigned Class Periods
                  </h2>
                  <p className="text-xs text-slate-500">Weekly operational timetable periods</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  Today is {dayName}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                {/* Substituted Classes Assigned to Logged-in Teacher */}
                {state.substitutionRequests
                  .filter(
                    (r) =>
                      r.status === 'accepted' &&
                      r.substituteTeacherId === (session?.linkedId || session?.userId)
                  )
                  .map((subReq) => {
                    const subSlot = state.timetable.find((t) => t.id === subReq.timetableId);
                    const subCourse = state.courses.find((c) => c.id === subReq.courseId);
                    const origTeacher = state.teachers.find((t) => t.id === subReq.originalTeacherId);
                    const isCurrent = activeSession?.timetableId === subSlot?.id;

                    if (!subSlot || !subCourse) return null;

                    return (
                      <div
                        key={`sub_${subReq.id}`}
                        className="py-3 flex items-center justify-between gap-3 bg-amber-50/80 p-3 rounded-xl border border-amber-200 mb-2.5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-900">
                              {subSlot.startTime} – {subSlot.endTime}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                              Covering: {origTeacher?.name || 'Faculty'}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs mt-1">
                            {subCourse.code} — {subCourse.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Substituted Lecture ({formatDate(subReq.date)}) · Room: {subSlot.className || 'Hall A'}
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 size={14} /> Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startClassSession(subSlot.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors active:scale-95"
                            >
                              <Play size={13} />
                              <span>Start Substituted Class</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {state.timetable.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No classes registered in the college timetable.
                  </div>
                ) : (
                  state.timetable.map((slot) => {
                    const course = state.courses.find((c) => c.id === slot.courseId);
                    const isCurrent = activeSession?.timetableId === slot.id;
                    const isToday = slot.day === dayName;

                    return (
                      <div key={slot.id} className="py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700">
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                isToday ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {slot.day}
                            </span>
                          </div>
                          <div className="font-bold text-slate-800 text-xs mt-1">
                            {course?.code} — {course?.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Room: {slot.className || 'Lecture Hall'} · {slot.slotType}
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 size={14} /> Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startClassSession(slot.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors active:scale-95"
                            >
                              <Play size={13} />
                              <span>Start Class</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Real-time Punched-in Attendance Roster (Visible when session is active) */}
          {activeSession && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users size={18} className="text-indigo-600" />
                    <span>Live Punched-in Attendance Roster</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {currentSessionAttendees.length} Students Present
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time punch-ins from student QR terminals and mobile scanners
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateStudentScan}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <UserCheck size={14} />
                  <span>Test Attendance Punch-in</span>
                </button>
              </div>

              {currentSessionAttendees.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  Waiting for students to scan QR code... (Use &quot;Test Scan&quot; above to simulate instant punch-in)
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentSessionAttendees.map((rec) => {
                    const stu = state.students.find((s) => s.id === rec.studentId);
                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{stu?.name || 'Student'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {stu?.admissionNumber} · Roll: {stu?.classNumber}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock size={11} />
                            Punched at {rec.arrivalTime}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STUDENT SCAN TERMINAL                                       */}
      {/* ============================================================== */}
      {mode === 'scan' && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Active Live Class Detection Banner */}
          {activeSessionForStudent ? (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl shadow-emerald-600/10 space-y-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                Live Classroom Session Detected
              </div>

              <div>
                <h2 className="text-xl font-black">
                  {state.courses.find((c) => c.id === activeSessionForStudent.courseId)?.name || 'Class Lecture'}
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Instructor: {state.teachers.find((t) => t.id === activeSessionForStudent.teacherId)?.name} · Room: {activeSessionForStudent.className || 'Lecture Hall'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleInstantPunchIn(activeSessionForStudent.qrToken)}
                  className="w-full py-3.5 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-sm shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>One-Click Punch In Attendance Now</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-3">
              <Info size={18} className="text-indigo-600 shrink-0" />
              <span>
                No live QR session is currently open for your class section. If your teacher has launched a class, enter the token below.
              </span>
            </div>
          )}

          {/* Live Camera Scanner Box */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Camera size={18} className="text-indigo-600" />
                <span>Live Optical Camera Scanner</span>
              </div>
              {isCameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <CameraOff size={14} />
                  <span>Stop Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Camera size={14} />
                  <span>Open Camera Scanner</span>
                </button>
              )}
            </div>

            {isCameraActive ? (
              <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden bg-black aspect-square border-2 border-indigo-500 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual Scanning Viewfinder Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-2xl pointer-events-none flex items-center justify-center animate-pulse">
                  <div className="w-full h-0.5 bg-emerald-400/80 shadow-md shadow-emerald-400 animate-bounce" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] py-1 px-2 rounded-lg">
                  Point camera at teacher's QR display on projector
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="text-xs text-slate-600">
                  <div className="font-bold text-slate-800">Scan with Device Camera:</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click "Open Camera Scanner" to scan the projector screen or pick a photo.
                  </p>
                </div>
                <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors">
                  <Upload size={14} />
                  <span>Upload QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {cameraError}
              </div>
            )}
          </div>

          {/* Quick 4-Character Code Terminal */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <QrCode size={28} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Enter Short Class Code</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Type the 4-character code shown below the classroom QR projector.
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="e.g. 7K9M"
                  value={qrInputToken}
                  onChange={(e) => setQrInputToken(e.target.value.toUpperCase())}
                  className="w-full max-w-xs text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-2xl font-black text-slate-900 tracking-widest uppercase focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  4-Character Quick Attendance Code
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                Punch In Attendance
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handlePunchOut}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
              >
                <DoorOpen size={14} />
                <span>Gate Exit Punch-Out</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLateModal(true)}
                className="text-amber-600 hover:underline font-bold"
              >
                Request Late Clearance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. LIVE CLASSROOM RADAR & MONITOR (CHAIRMAN / HOD / SYSADMIN)  */}
      {/* ============================================================== */}
      {mode === 'monitor' && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Active Classes
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-0.5 font-sans">
                  {state.attendanceSessions.filter((s) => s.status === 'open' && s.date === today).length}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  Punched In Today
                </div>
                <div className="text-2xl font-black text-indigo-700 mt-0.5 font-sans">
                  {state.attendanceRecords.filter((r) => r.date === today).length}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  Late Arrivals
                </div>
                <div className="text-2xl font-black text-amber-600 mt-0.5 font-sans">
                  {state.attendanceRecords.filter((r) => r.date === today && r.status === 'late').length}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  Pending Late Approvals
                </div>
                <div className="text-2xl font-black text-purple-700 mt-0.5 font-sans">
                  {state.lateScanRequests.filter((r) => r.status === 'pending').length}
                </div>
              </div>
            </div>
          </div>

          {/* Subtab Navigation */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              type="button"
              onClick={() => setMonitorTab('radar')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                monitorTab === 'radar'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Radio size={16} />
              Live Classroom Radar
              {state.attendanceSessions.filter((s) => s.status === 'open' && s.date === today).length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMonitorTab('clearance')}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                monitorTab === 'clearance'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck size={16} />
              Late Scan Clearances
              {state.lateScanRequests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-3xs font-black">
                  {state.lateScanRequests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: LIVE CLASSROOM RADAR */}
          {monitorTab === 'radar' && (
            <div className="space-y-6">
              {state.attendanceSessions.filter((s) => s.status === 'open' && s.date === today).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {state.attendanceSessions
                    .filter((s) => s.status === 'open' && s.date === today)
                    .map((s) => {
                      const course = state.courses.find((c) => c.id === s.courseId);
                      const teacher = state.teachers.find((t) => t.id === s.teacherId);
                      const sec = state.sections.find((x) => x.id === s.sectionId);
                      const attendees = state.attendanceRecords.filter((r) => r.sessionId === s.id);
                      const isExpanded = expandedSessionId === s.id;

                      return (
                        <div
                          key={s.id}
                          className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/5 space-y-4 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-3xs uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Live Session Recording
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-500">
                              Room: {s.className || 'Lecture Hall'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {course?.code} — {course?.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Faculty: <strong>{teacher?.name}</strong> · Section {sec?.name || 'A'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-slate-400 block text-3xs uppercase font-bold">
                                Attendance Count
                              </span>
                              <span className="text-sm font-black text-indigo-700">
                                {attendees.length} Students Punched
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-3xs uppercase font-bold">
                                Active Token
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-700">
                                {s.qrToken}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <button
                              type="button"
                              onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                              className="text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-800"
                            >
                              <span>{isExpanded ? 'Hide Punch-in Roster' : 'View Punch-in Roster'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => rotateQrToken(s.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-3xs flex items-center gap-1"
                              >
                                <RefreshCw size={12} /> Rotate
                              </button>
                              <button
                                type="button"
                                onClick={() => closeClassSession(s.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-3xs border border-rose-200 flex items-center gap-1"
                              >
                                <Square size={12} /> End Class
                              </button>
                            </div>
                          </div>

                          {/* Expandable Live Roster */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                              <h4 className="text-xs font-bold text-slate-700">Live Attendance Roster:</h4>
                              {attendees.length === 0 ? (
                                <p className="text-2xs text-slate-400 italic">No students punched in yet.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {attendees.map((rec) => {
                                    const st = state.students.find((stu) => stu.id === rec.studentId);
                                    return (
                                      <div
                                        key={rec.id}
                                        className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-2xs"
                                      >
                                        <span className="font-semibold text-slate-800">
                                          {st?.name} ({st?.admissionNumber})
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400">{rec.arrivalTime}</span>
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-3xs font-black uppercase ${
                                              rec.status === 'present'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {rec.status}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Radio size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No Classroom Sessions Live Right Now</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When faculty members launch a class via &quot;Start Class / Live QR&quot;, active radar tracking cards will populate here in real-time.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LATE SCAN CLEARANCES */}
          {monitorTab === 'clearance' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {state.lateScanRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">No Pending Clearance Requests</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Student late punch-in clearance applications will appear here for Chairman/HOD approval.
                  </p>
                </div>
              ) : (
                state.lateScanRequests.map((req) => {
                  const stu = state.students.find((s) => s.id === req.studentId);
                  const isPending = req.status === 'pending';

                  return (
                    <div key={req.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{stu?.name || 'Student'}</span>
                          <span className="text-xs text-slate-400">({stu?.admissionNumber})</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-3xs font-black uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Delay Justification:</strong> {req.reason}
                        </p>
                        <span className="text-3xs text-slate-400 block">{formatDateTime(req.requestedAt)}</span>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decideLateScan(req.id, 'approved', 'Chairman Clearance Granted')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Check size={14} /> Approve Clearance
                          </button>
                          <button
                            type="button"
                            onClick={() => decideLateScan(req.id, 'rejected', 'Delay justification rejected')}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 transition-colors"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PROJECTOR FULLSCREEN MODAL FOR CLASSROOM SCREENS            */}
      {/* ============================================================== */}
      {isProjectorModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md text-white animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsProjectorModalOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center space-y-5 max-w-xl">
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                ● Live Classroom Attendance Terminal
              </span>
              <h2 className="text-3xl font-black mt-3">
                {state.courses.find((c) => c.id === activeSession.courseId)?.name || 'Class Lecture'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Government College of Technology Peshawar · Scan with your mobile device
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl">
              <canvas
                ref={projectorCanvasRef}
                width={360}
                height={360}
                className="rounded-2xl mx-auto"
              />
            </div>

            <div className="space-y-2">
              <div className="font-mono text-4xl font-black bg-white/10 px-8 py-3 rounded-2xl border border-white/20 inline-block text-amber-300 tracking-widest">
                {activeSession.qrToken}
              </div>
              <p className="text-sm text-slate-300">
                Code auto-refreshes in <strong>{secondsUntilRotate} seconds</strong>. 3 Late punch-ins = 1 Absence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. LATE CLEARANCE MODAL (FOR STUDENTS)                         */}
      {/* ============================================================== */}
      {showLateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-slate-900 text-sm">Request Late Attendance Clearance</h3>
            <p className="text-xs text-slate-500">
              If transport issues, road blockages, or verified medical reasons caused your delay, submit your justification to the Chairman/HOD for attendance consideration.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Delay *</label>
              <textarea
                rows={3}
                placeholder="BRT bus delay, heavy rain / road maintenance, medical appointment..."
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLateModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 font-semibold text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestLate}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white shadow-md shadow-indigo-600/20"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
