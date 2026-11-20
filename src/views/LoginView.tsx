import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { UserRole } from '../types/erp';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

interface QuickRole {
  role: UserRole;
  label: string;
  email: string;
  desc: string;
  badge: string;
}

const QUICK_ROLES: QuickRole[] = [
  {
    role: 'sysadmin',
    label: 'Admin',
    email: 'admin@gctpeshawar.edu.pk',
    desc: 'Unrestricted System Access',
    badge: 'bg-purple-100 text-purple-800'
  },
  {
    role: 'chairman',
    label: 'Chairman',
    email: 'chairman.civil@gctpeshawar.edu.pk',
    desc: 'B.Tech Civil Engineering',
    badge: 'bg-blue-100 text-blue-800'
  },
  {
    role: 'hod',
    label: 'HOD',
    email: 'hod.mechanical@gctpeshawar.edu.pk',
    desc: 'DAE Mechanical Dept',
    badge: 'bg-indigo-100 text-indigo-800'
  },
  {
    role: 'coordinator',
    label: 'Coordinator',
    email: 'coord.civil@gctpeshawar.edu.pk',
    desc: 'Academic Timetables & OBE',
    badge: 'bg-sky-100 text-sky-800'
  },
  {
    role: 'teacher',
    label: 'Teacher',
    email: 'teacher.khan@gctpeshawar.edu.pk',
    desc: 'Engr. Tariq Khan (Civil)',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  {
    role: 'student',
    label: 'Student',
    email: 'student.ahmad@gctpeshawar.edu.pk',
    desc: 'Ahmad Khan (Class 001)',
    badge: 'bg-amber-100 text-amber-800'
  },
  {
    role: 'parent',
    label: 'Parent',
    email: 'parent.ahmad@gctpeshawar.edu.pk',
    desc: 'Guardian of Ahmad Khan',
    badge: 'bg-pink-100 text-pink-800'
  },
  {
    role: 'assistant',
    label: 'Assistant',
    email: 'assistant@gct.edu.pk',
    desc: 'Mr. Asif Khan (Office Asst)',
    badge: 'bg-slate-100 text-slate-800'
  },
  {
    role: 'clerk',
    label: 'Clerk',
    email: 'clerk@gct.edu.pk',
    desc: 'Mr. Niaz Muhammad (Clerk)',
    badge: 'bg-teal-100 text-teal-800'
  }
];

export const LoginView: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login, setUser, user, session, registerAccount, addToast, state } = useERP();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [emailOrCnic, setEmailOrCnic] = useState('admin@gctpeshawar.edu.pk');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Public signup state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCnic, setRegCnic] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regDeptId, setRegDeptId] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const userSession = login(emailOrCnic, password, rememberMe);
      if (setUser) setUser(userSession);
      addToast('Welcome to GCT Peshawar ERP', 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid email/CNIC or password');
    }
  };

  const handleQuickRole = (qr: QuickRole) => {
    setEmailOrCnic(qr.email);
    setPassword('password');
    setErrorMsg('');
    try {
      const userSession = login(qr.email, 'password', true);
      if (setUser) setUser(userSession);
      addToast(`Logged in as ${qr.label}`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      addToast('Please fill in all required registration fields', 'error');
      return;
    }

    try {
      registerAccount({
        displayName: regFullName,
        email: regEmail,
        cnic: regCnic,
        role: regRole,
        password: regPassword,
        departmentId: regDeptId || undefined,
        status: 'Pending'
      });
      setRegSuccess(true);
      addToast('Application submitted. Awaiting administrative approval.', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Registration failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-800">
      {/* Background visual elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* College Crest & Branding */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4 border border-indigo-400/30">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          GCT PESHAWAR
        </h1>
        <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mt-1">
          Government College of Technology
        </p>
        <p className="text-2xs text-slate-400 mt-0.5">
          KP-TEVTA Technical Education ERP Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        {/* Quick Demo Switcher */}
        <div className="mb-6 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              1-Click Role Switcher (SkoolZoom Demo)
            </span>
            <span className="text-2xs text-slate-400">Password: password</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_ROLES.map((qr) => (
              <button
                key={qr.role}
                type="button"
                onClick={() => handleQuickRole(qr)}
                className="text-left p-2 rounded-xl bg-slate-900/80 hover:bg-indigo-600/30 border border-slate-700/50 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                    {qr.label}
                  </span>
                  <span className={`text-3xs px-1.5 py-0.2 rounded font-semibold ${qr.badge}`}>
                    {qr.role}
                  </span>
                </div>
                <div className="text-3xs text-slate-400 truncate mt-1">{qr.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200/80">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In to Portal
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setRegSuccess(false);
              }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Apply for Account
            </button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email or CNIC Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={emailOrCnic}
                    onChange={(e) => setEmailOrCnic(e.target.value)}
                    placeholder="e.g. admin@gctpeshawar.edu.pk or 17301-..."
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-2xs text-slate-400">Default: password</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember active session
                </label>
                <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                  Need Help?
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                Sign In to ERP Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div>
              {regSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Registration Submitted!</h3>
                  <p className="text-xs text-slate-600">
                    Your account request has been logged. The GCT Registrar / System Administrator will review your CNIC and credentials before activation.
                  </p>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold mt-3"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Bilal Ahmad Khan"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        CNIC (13 digits) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regCnic}
                        onChange={(e) => setRegCnic(e.target.value)}
                        placeholder="17301-1234567-1"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        placeholder="0300-1234567"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Desired Role *
                      </label>
                      <select
                        value={regRole}
                        onChange={(e: any) => setRegRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher / Lecturer</option>
                        <option value="parent">Parent / Guardian</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={regDeptId}
                      onChange={(e) => setRegDeptId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Technology / Department --</option>
                      {state.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Account Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-3 pr-10 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    Submit Registration Application
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Government College of Technology, Peshawar. All rights reserved.
        </p>
      </div>
    </div>
  );
};
