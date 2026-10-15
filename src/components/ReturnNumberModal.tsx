import React, { useState } from 'react';
import { X, RotateCcw, Calendar, User, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MobileRecord } from '../types';

interface ReturnNumberModalProps {
  record: MobileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    id: string;
    phoneNumber: string;
    returnDate: string;
    notes?: string;
  }) => Promise<void>;
}

export const ReturnNumberModal: React.FC<ReturnNumberModalProps> = ({
  record,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !record) return null;

  const today = new Date().toISOString().split('T')[0];
  const [returnDate, setReturnDate] = useState(today);
  const [returnReason, setReturnReason] = useState('Project Completed');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const REASONS = [
    'Project Completed',
    'Employee Resigned / Offboarding',
    'Device Upgrade / Replacement',
    'Role Transition (No longer needs cellular)',
    'Temporary Leave / Reallocated',
    'Damaged / Hardware Defect'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const combinedNotes = `Reason: ${returnReason}. ${notes}`.trim();
      await onConfirm({
        id: record.id,
        phoneNumber: record.phoneNumber,
        returnDate,
        notes: combinedNotes
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to return number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Return Mobile Number</h3>
              <p className="text-xs text-slate-500">Release line back to available pool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Allocation Info */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-900 text-sm">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>{record.phoneNumber}</span>
            </div>
            <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px]">
              Assigned
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Current Assignee</span>
              <span className="font-bold text-slate-800">{record.assignedTo || 'Unknown'}</span>
              {record.employeeId && (
                <span className="text-[11px] font-mono text-slate-500 block">({record.employeeId})</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Department</span>
              <span className="font-medium text-slate-800">{record.department || 'General'}</span>
              <span className="text-[11px] text-slate-400 block">Since: {record.assignmentDate || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Return Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Return Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Reason for return */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Circumstance
            </label>
            <select
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden bg-white"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection / Return Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Physical SIM card inspected, device factory reset completed, passed tests."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden resize-none"
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-sm shadow-amber-200 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Return to Pool</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
