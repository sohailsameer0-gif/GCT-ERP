import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Edit,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDate } from '../services/calculations';
import { Committee, CommitteeMember } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface CommitteesViewProps {
  initialTab?: 'committees' | 'meetings';
}

export const CommitteesView: React.FC<CommitteesViewProps> = ({
  initialTab = 'committees',
}) => {
  const {
    state,
    can,
    createCommittee,
    updateCommittee,
    deleteCommittee,
    addCommitteeMember,
    removeCommitteeMember,
    scheduleMeeting,
    approveMeeting,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'committees' | 'meetings'>(initialTab);

  const [isCmtModalOpen, setIsCmtModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [targetCmtId, setTargetCmtId] = useState('');
  const [committeeToDissolve, setCommitteeToDissolve] = useState<Committee | null>(null);

  // Committee form
  const [cmtForm, setCmtForm] = useState({
    name: '',
    formationDate: new Date().toISOString().slice(0, 10),
    committeeType: 'Main' as Committee['committeeType'],
    committeeKind: 'OBE' as Committee['committeeKind'],
    description: '',
  });

  const COMMITTEE_TEMPLATES = [
    {
      name: 'Institutional Discipline & Proctorial Board',
      kind: 'Discipline' as const,
      type: 'Standing' as const,
      desc: 'Enforces student code of conduct, investigates violations, and recommends disciplinary actions.',
    },
    {
      name: 'Anti-Harassment & Grievance Redressal Committee',
      kind: 'Harassment' as const,
      type: 'Standing' as const,
      desc: 'Formed per KP-TEVTA statutory guidelines to handle employee and student grievances with confidentiality.',
    },
    {
      name: 'Sports, Athletics & Extracurricular Activities Committee',
      kind: 'Sports' as const,
      type: 'Main' as const,
      desc: 'Oversees college athletic competitions, sports galas, table tennis tournaments, and ground maintenance.',
    },
    {
      name: 'Hostel, Boarding & Mess Management Committee',
      kind: 'Hostel' as const,
      type: 'Standing' as const,
      desc: 'Monitors hostel allotment, meal hygiene, student welfare, and residence security protocols.',
    },
    {
      name: 'Admissions, Scrutiny & Merit Determination Board',
      kind: 'Admissions' as const,
      type: 'Standing' as const,
      desc: 'Verifies Matric/F.Sc/DAE transcripts, verifies domicile quotas, and prepares merit lists for enrollment.',
    },
    {
      name: 'Departmental Examination & Moderation Board',
      kind: 'Examination' as const,
      type: 'Main' as const,
      desc: 'Conducts mid-term and final examinations, supervises paper moderation, and reconciles award lists.',
    },
    {
      name: 'OBE Curriculum & Assessment Steering Committee',
      kind: 'OBE' as const,
      type: 'Main' as const,
      desc: 'National Technology Council (NTC) / PEC Outcome-Based Education alignment and CQI monitoring.',
    },
    {
      name: 'Annual Purchase, Works & Tender Committee',
      kind: 'General' as const,
      type: 'Main' as const,
      desc: 'Reviews lab equipment procurement, annual maintenance contracts, and inventory auditing.',
    },
    {
      name: 'Students Welfare & Merit Scholarship Committee',
      kind: 'Standalone' as const,
      type: 'Standing' as const,
      desc: 'Administers KP Government scholarships, fee concession appeals, and needy students support funds.',
    },
    {
      name: 'Departmental Quality Assurance Cell (QAC)',
      kind: 'Standalone' as const,
      type: 'Main' as const,
      desc: 'Internal academic auditing, faculty development reviews, and curriculum modernization.',
    },
  ];

  // Member form
  const [memberForm, setMemberForm] = useState({
    memberName: '',
    designation: 'Senior Faculty',
    position: 'Member',
  });

  // Meeting form
  const [meetingForm, setMeetingForm] = useState({
    committeeId: '',
    subject: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00 AM',
    venue: 'Conference Room 1',
    agenda: '',
  });

  const handleCmtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmtForm.name.trim()) return;
    createCommittee(cmtForm);
    setIsCmtModalOpen(false);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.memberName.trim()) return;
    addCommitteeMember({
      ...memberForm,
      committeeId: targetCmtId,
    });
    setIsMemberModalOpen(false);
  };

  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.subject.trim()) return;
    scheduleMeeting({
      ...meetingForm,
      committeeId: meetingForm.committeeId || state.committees[0]?.id || '',
    });
    setIsMeetingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Institutional Committees & Accreditation
          </h1>
          <p className="text-xs text-slate-500">
            Outcome Based Education (OBE), Academic Transition (AT), and Departmental Standing Boards
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {can('committees.manage') && (
            <button
              onClick={() => setIsCmtModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Create Committee</span>
            </button>
          )}
          {can('meetings.manage') && (
            <button
              onClick={() => {
                setMeetingForm({
                  committeeId: state.committees[0]?.id || '',
                  subject: '',
                  date: new Date().toISOString().slice(0, 10),
                  time: '10:00 AM',
                  venue: 'Conference Hall',
                  agenda: '',
                });
                setIsMeetingModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Calendar size={15} />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-slate-200/80 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('committees')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'committees' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Committees Register ({state.committees.length})
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'meetings' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Meetings & Deliberations ({state.committeeMeetings.length})
        </button>
      </div>

      {/* COMMITTEES TAB */}
      {activeTab === 'committees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.committees.map((cmt) => {
            const members = state.committeeMembers.filter(
              (m) => m.committeeId === cmt.id && m.status === 'Active'
            );

            return (
              <div
                key={cmt.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                        {cmt.committeeKind} Board
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-1">{cmt.name}</h2>
                      <div className="text-[11px] text-slate-400">
                        Formed on {formatDate(cmt.formationDate)} · Type: {cmt.committeeType}
                      </div>
                    </div>

                    <button
                      onClick={() => setCommitteeToDissolve(cmt)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Dissolve Committee"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {cmt.description && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {cmt.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Active Members ({members.length})
                      </span>
                      {can('committees.manage') && (
                        <button
                          onClick={() => {
                            setTargetCmtId(cmt.id);
                            setMemberForm({ memberName: '', designation: 'Lecturer', position: 'Member' });
                            setIsMemberModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <UserPlus size={13} /> Add Member
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{m.memberName}</span>
                            <span className="text-slate-500 text-[11px] ml-1.5 font-medium">
                              ({m.designation})
                            </span>
                            <div className="text-[10px] font-extrabold uppercase text-indigo-600">
                              {m.position}
                            </div>
                          </div>

                          {can('committees.manage') && (
                            <button
                              onClick={() => removeCommitteeMember(m.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Remove Member"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MEETINGS TAB */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {state.committeeMeetings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
              No committee meetings currently recorded.
            </div>
          ) : (
            state.committeeMeetings.map((meeting) => {
              const cmt = state.committees.find((c) => c.id === meeting.committeeId);

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-sm">{meeting.subject}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          meeting.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {meeting.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Committee: <strong>{cmt?.name || 'General Board'}</strong> · Date:{' '}
                      {formatDate(meeting.date)} ({meeting.time || '10:00 AM'}) · Venue:{' '}
                      {meeting.venue || 'Campus Board Room'}
                    </div>

                    {meeting.agenda && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                        {meeting.agenda}
                      </p>
                    )}
                  </div>

                  {meeting.status !== 'Approved' && can('meetings.manage') && (
                    <button
                      onClick={() => approveMeeting(meeting.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Check size={14} /> Approve Minutes
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Committee Modal */}
      {isCmtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Create Institutional Standing Committee</h2>
              <p className="text-2xs text-slate-500 mt-0.5">
                Setup administrative, disciplinary, sports, accreditation, or welfare committees for the college.
              </p>
            </div>

            <form onSubmit={handleCmtSubmit} className="space-y-3.5 text-xs">
              {/* Template Quick Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Institutional Committee Templates (Select or Type Custom Below)
                </label>
                <select
                  onChange={(e) => {
                    const selected = COMMITTEE_TEMPLATES.find((t) => t.name === e.target.value);
                    if (selected) {
                      setCmtForm({
                        ...cmtForm,
                        name: selected.name,
                        committeeKind: selected.kind,
                        committeeType: selected.type,
                        description: selected.desc,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                >
                  <option value="">-- Choose Standard GCT Committee Template --</option>
                  {COMMITTEE_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.name} value={tmpl.name}>
                      {tmpl.name} ({tmpl.kind})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Committee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Institutional Discipline & Proctorial Board"
                  value={cmtForm.name}
                  onChange={(e) => setCmtForm({ ...cmtForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Accreditation / Board Focus</label>
                  <select
                    value={cmtForm.committeeKind}
                    onChange={(e) => setCmtForm({ ...cmtForm, committeeKind: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="Discipline">Discipline & Proctorial Affairs</option>
                    <option value="Sports">Sports & Extracurricular Activities</option>
                    <option value="Harassment">Anti-Harassment & Grievances</option>
                    <option value="Hostel">Hostel & Mess Management</option>
                    <option value="Admissions">Admissions & Scrutiny Board</option>
                    <option value="Examination">Examination & Assessments</option>
                    <option value="General">General Administration / Works</option>
                    <option value="OBE">OBE (Outcome Based Education / PEC)</option>
                    <option value="AT">Academic Transition (AT)</option>
                    <option value="PT">Program Technology (PT)</option>
                    <option value="Standalone">Institutional Standing Board</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Committee Type</label>
                  <select
                    value={cmtForm.committeeType}
                    onChange={(e) => setCmtForm({ ...cmtForm, committeeType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="Main">Main Council</option>
                    <option value="Standing">Standing Board</option>
                    <option value="Sub">Sub-Committee</option>
                    <option value="Ad-hoc">Ad-Hoc Inquiry</option>
                    <option value="Special">Special Task Force</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Mandate</label>
                <textarea
                  rows={2}
                  value={cmtForm.description}
                  onChange={(e) => setCmtForm({ ...cmtForm, description: e.target.value })}
                  placeholder="Outline the terms of reference, quorum requirements, and governance authority..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCmtModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">Add Committee Member</h2>
            <form onSubmit={handleMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Engr. Asad Khan"
                  value={memberForm.memberName}
                  onChange={(e) => setMemberForm({ ...memberForm, memberName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Designation</label>
                <input
                  type="text"
                  value={memberForm.designation}
                  onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Committee Position</label>
                <select
                  value={memberForm.position}
                  onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option>Convener</option>
                  <option>Co-Convener</option>
                  <option>Secretary</option>
                  <option>Joint Secretary</option>
                  <option>Member</option>
                  <option>Member (Ex-Officio)</option>
                  <option>External Expert</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-bold text-white"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">Schedule Official Meeting</h2>
            <form onSubmit={handleMeetingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Committee</label>
                <select
                  value={meetingForm.committeeId}
                  onChange={(e) => setMeetingForm({ ...meetingForm, committeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {state.committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meeting Subject / Agenda *</label>
                <input
                  type="text"
                  required
                  placeholder="OBE Criterion 3 Assessment Evaluation"
                  value={meetingForm.subject}
                  onChange={(e) => setMeetingForm({ ...meetingForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue</label>
                <input
                  type="text"
                  value={meetingForm.venue}
                  onChange={(e) => setMeetingForm({ ...meetingForm, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dissolve Committee Confirmation Modal */}
      <ConfirmModal
        isOpen={!!committeeToDissolve}
        title="Dissolve Institutional Committee"
        message={`Are you sure you want to dissolve committee "${committeeToDissolve?.name}"? All member appointments and recorded minutes will be archived.`}
        confirmLabel="Yes, Dissolve Committee"
        onConfirm={() => {
          if (committeeToDissolve) {
            deleteCommittee(committeeToDissolve.id);
            setCommitteeToDissolve(null);
          }
        }}
        onCancel={() => setCommitteeToDissolve(null)}
      />
    </div>
  );
};
