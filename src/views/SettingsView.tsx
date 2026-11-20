import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  Settings,
  Building,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Globe
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { state, updateSettings, addToast, can } = useERP();

  const [formData, setFormData] = useState({
    collegeName: state.settings.collegeName || 'Government College of Technology, Peshawar',
    departmentName: state.settings.departmentName || 'All Departments & Technologies',
    affiliation: state.settings.affiliation || 'Khyber Pakhtunkhwa Technical Education & Vocational Training Authority (KP-TEVTA)',
    shortageThreshold: state.settings.shortageThreshold ?? 70,
    lateToAbsenceThreshold: state.settings.lateToAbsenceThreshold ?? 3,
    qrValiditySeconds: state.settings.qrValiditySeconds ?? 30,
    gracePeriodMinutes: state.settings.gracePeriodMinutes ?? 15,
    currentTerm: state.settings.currentTerm || 'Fall',
    currentYear: state.settings.currentYear || 2024,
    email: state.settings.email || 'principal@gctpeshawar.edu.pk',
    phone: state.settings.phone || '+92 91 9211432',
    address: state.settings.address || 'Kohat Road, Peshawar, Khyber Pakhtunkhwa, Pakistan',
    website: state.settings.website || 'https://www.gctpeshawar.edu.pk',
    chairmanName: state.settings.chairmanName || 'Engr. Prof. Dr. Muhammad Tariq',
    footerText: state.settings.footerText || 'Official Academic Record • Government College of Technology Peshawar'
  });

  const canEdit = can('settings_edit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      addToast('You do not have permission to alter institutional settings', 'error');
      return;
    }

    try {
      updateSettings({
        collegeName: formData.collegeName,
        departmentName: formData.departmentName,
        affiliation: formData.affiliation,
        shortageThreshold: Number(formData.shortageThreshold),
        lateToAbsenceThreshold: Number(formData.lateToAbsenceThreshold),
        qrValiditySeconds: Number(formData.qrValiditySeconds),
        gracePeriodMinutes: Number(formData.gracePeriodMinutes),
        currentTerm: formData.currentTerm as 'Spring' | 'Fall',
        currentYear: Number(formData.currentYear),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website,
        chairmanName: formData.chairmanName,
        footerText: formData.footerText
      });
      addToast('Institutional settings updated successfully', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to update settings', 'error');
    }
  };

  const handleResetDefaults = () => {
    if (!canEdit) return;
    setFormData({
      collegeName: 'Government College of Technology, Peshawar',
      departmentName: 'All Departments & Technologies',
      affiliation: 'Khyber Pakhtunkhwa Technical Education & Vocational Training Authority (KP-TEVTA)',
      shortageThreshold: 70,
      lateToAbsenceThreshold: 3,
      qrValiditySeconds: 30,
      gracePeriodMinutes: 15,
      currentTerm: 'Fall',
      currentYear: 2024,
      email: 'principal@gctpeshawar.edu.pk',
      phone: '+92 91 9211432',
      address: 'Kohat Road, Peshawar, Khyber Pakhtunkhwa, Pakistan',
      website: 'https://www.gctpeshawar.edu.pk',
      chairmanName: 'Engr. Prof. Dr. Muhammad Tariq',
      footerText: 'Official Academic Record • Government College of Technology Peshawar'
    });
    addToast('Form values reset to GCT standard defaults', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            System & College ERP Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global institution parameters, attendance thresholds, and official letterhead
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institutional Branding */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">
              Institutional Profile & Letterhead
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                College Name *
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Controlling / Affiliating Authority
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.affiliation}
                onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled={!canEdit}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Phone / PBX
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Campus Postal Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Policies & Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">
              Academic Attendance Policies & Regulations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Shortage Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={90}
                disabled={!canEdit}
                value={formData.shortageThreshold}
                onChange={(e) => setFormData({ ...formData, shortageThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Students below this percentage are barred from exams.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Late-to-Absent Conversion Ratio
              </label>
              <input
                type="number"
                min={1}
                max={10}
                disabled={!canEdit}
                value={formData.lateToAbsenceThreshold}
                onChange={(e) => setFormData({ ...formData, lateToAbsenceThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Standard: 3 late marks count as 1 absence.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Late Entry Grace Period (Mins)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                disabled={!canEdit}
                value={formData.gracePeriodMinutes}
                onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Minutes after start time before recording as Late.
              </p>
            </div>
          </div>
        </div>

        {/* QR Security & Academic Term */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">
              QR Token Rotation & Active Term
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                QR Token Rotation (Seconds)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                disabled={!canEdit}
                value={formData.qrValiditySeconds}
                onChange={(e) => setFormData({ ...formData, qrValiditySeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Prevents photo sharing by rotating dynamic QR tokens.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Active Academic Term
              </label>
              <select
                disabled={!canEdit}
                value={formData.currentTerm}
                onChange={(e: any) => setFormData({ ...formData, currentTerm: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="Fall">Fall Term</option>
                <option value="Spring">Spring Term</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <input
                type="number"
                min={2020}
                max={2030}
                disabled={!canEdit}
                value={formData.currentYear}
                onChange={(e) => setFormData({ ...formData, currentYear: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Institutional Policies
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
