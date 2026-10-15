import React, { useState } from 'react';
import { X, UserCheck, Calendar, Building2, User, FileText, Smartphone } from 'lucide-react';
import { MobileRecord } from '../types';
import { DEPARTMENTS } from '../services/mockData';

interface AssignNumberModalProps {
  record: MobileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    id: string;
    phoneNumber: string;
    assignedTo: string;
    employeeId: string;
    department: string;
    assignmentDate: string;
    purpose: string;
    notes?: string;
  }) => Promise<void>;
}

export const AssignNumberModal: React.FC<AssignNumberModalProps> = ({
  record,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !record) return null;

  const today = new Date().toISOString().split('T')[0];
  const [assignedTo, setAssignedTo] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [assignmentDate, setAssignmentDate] = useState(today);
  const [purpose, setPurpose] = useState('Field Sales & Client Communication');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const COMMON_PURPOSES = [
    'Field Sales & Client Communication',
    'On-Call Incident Escalations & Support',
    'Executive Roaming & Remote Work',
    'Fleet Logistics & Regional Dispatch',
    'Customer Care VIP Hotline',
    'Temporary Project Assignment',
    'General Business Device'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!assignedTo.trim()) {
      setError('Employee name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm({
        id: record.id,
        phoneNumber: record.phoneNumber,
        assignedTo: assignedTo.trim(),
        employeeId: employeeId.trim(),
        department,
        assignmentDate,
        purpose,
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Assign Mobile Number</h3>
              <p className="text-xs text-slate-500">Allocate SIM & phone line to employee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Phone Info Banner */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900 font-mono text-sm">{record.phoneNumber}</span>
            <span className="bg-white px-2 py-0.5 rounded text-slate-700 border border-slate-200 font-medium">
              {record.carrier}
            </span>
          </div>
          <span className="text-slate-500 font-medium">
            {record.planType || 'Standard Plan'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                placeholder="e.g. EMP-1092"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-white"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignment Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={assignmentDate}
                  onChange={e => setAssignmentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Purpose
            </label>
            <input
              type="text"
              list="purpose-suggestions"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
            />
            <datalist id="purpose-suggestions">
              {COMMON_PURPOSES.map(p => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Notes / Hardware details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Handed over iPhone 13 (IMEI: 358...) with protective case and charger."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
