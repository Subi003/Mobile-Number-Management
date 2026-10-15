import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Building2, 
  User, 
  DollarSign, 
  Tag, 
  AlertTriangle, 
  Check, 
  Save, 
  Plus
} from 'lucide-react';
import { MobileRecord, StatusType } from '../types';
import { POPULAR_CARRIERS, DEPARTMENTS } from '../services/mockData';
import { normalizePhoneNumber } from '../services/googleSheetsService';

interface AddEditNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: MobileRecord | null;
  existingRecords: MobileRecord[];
  onSave: (record: Partial<MobileRecord>) => Promise<void>;
}

export const AddEditNumberModal: React.FC<AddEditNumberModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  existingRecords,
  onSave
}) => {
  if (!isOpen) return null;

  const isEditing = !!recordToEdit;

  const [phoneNumber, setPhoneNumber] = useState(recordToEdit?.phoneNumber || '');
  const [carrier, setCarrier] = useState(recordToEdit?.carrier || POPULAR_CARRIERS[0]);
  const [customCarrier, setCustomCarrier] = useState('');
  const [simNumber, setSimNumber] = useState(recordToEdit?.simNumber || '');
  const [planType, setPlanType] = useState(recordToEdit?.planType || 'Unlimited 5G Business');
  const [monthlyCost, setMonthlyCost] = useState(recordToEdit?.monthlyCost !== undefined ? String(recordToEdit.monthlyCost) : '45');
  const [status, setStatus] = useState<StatusType>(recordToEdit?.status || 'available');
  
  // Assignment fields if assigned
  const [assignedTo, setAssignedTo] = useState(recordToEdit?.assignedTo || '');
  const [employeeId, setEmployeeId] = useState(recordToEdit?.employeeId || '');
  const [department, setDepartment] = useState(recordToEdit?.department || DEPARTMENTS[0]);
  const [purpose, setPurpose] = useState(recordToEdit?.purpose || 'General Business Operations');
  const [notes, setNotes] = useState(recordToEdit?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check for duplicate phone number
  const isDuplicate = React.useMemo(() => {
    if (!phoneNumber.trim()) return false;
    const target = normalizePhoneNumber(phoneNumber);
    if (!target) return false;
    return existingRecords.some(r => {
      if (recordToEdit && r.id === recordToEdit.id) return false;
      return normalizePhoneNumber(r.phoneNumber) === target;
    });
  }, [phoneNumber, existingRecords, recordToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError('Mobile number is required.');
      return;
    }

    if (isDuplicate) {
      setError(`Mobile number "${phoneNumber}" already exists in the system. Duplicate numbers are forbidden.`);
      return;
    }

    if (status === 'assigned' && !assignedTo.trim()) {
      setError('Employee name is required when status is set to Assigned.');
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenCarrier = carrier === 'Other' && customCarrier.trim() ? customCarrier.trim() : carrier;

      await onSave({
        id: recordToEdit?.id,
        phoneNumber: phoneNumber.trim(),
        carrier: chosenCarrier,
        simNumber: simNumber.trim(),
        planType: planType.trim(),
        monthlyCost: parseFloat(monthlyCost) || 0,
        status,
        assignedTo: status === 'assigned' ? assignedTo.trim() : '',
        employeeId: status === 'assigned' ? employeeId.trim() : '',
        department: status === 'assigned' ? department : '',
        purpose: status === 'assigned' ? purpose.trim() : '',
        notes: notes.trim(),
        assignmentDate: status === 'assigned' ? (recordToEdit?.assignmentDate || new Date().toISOString().split('T')[0]) : ''
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed saving record.');
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
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Edit Mobile Number Record' : 'Register New Mobile Number'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update cellular inventory specifications' : 'Add phone line and SIM to corporate repository'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isDuplicate && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-300 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Duplicate detected! This number is already registered in inventory.</span>
            </div>
          )}

          {/* Mobile Number & Carrier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 outline-hidden font-mono ${
                    isDuplicate 
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/30' 
                      : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telecom Carrier
              </label>
              <select
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-white"
              >
                {POPULAR_CARRIERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {carrier === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specify Carrier Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rogers, Telus, Singtel"
                value={customCarrier}
                onChange={e => setCustomCarrier(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>
          )}

          {/* SIM Card & Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SIM / ICCID Number
              </label>
              <input
                type="text"
                placeholder="8901410..."
                value={simNumber}
                onChange={e => setSimNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Cost ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="45"
                  value={monthlyCost}
                  onChange={e => setMonthlyCost(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Plan Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data & Voice Plan
            </label>
            <input
              type="text"
              placeholder="e.g. Unlimited 5G Business, 50GB Shared, Voice Only"
              value={planType}
              onChange={e => setPlanType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
            />
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inventory Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'available', label: 'Available', color: 'emerald' },
                { id: 'assigned', label: 'Assigned', color: 'indigo' },
                { id: 'reserved', label: 'Reserved', color: 'amber' },
                { id: 'maintenance', label: 'Maint.', color: 'rose' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as StatusType)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    status === st.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* If Status is ASSIGNED, expand employee fields */}
          {status === 'assigned' && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Assignee Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Employee Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={status === 'assigned'}
                    placeholder="Full Name"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-..."
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field Sales"
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Inventory Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Stored in HQ cabinet #3, Nano-SIM compatible, eSIM voucher ID..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDuplicate}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                isDuplicate 
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Register Number'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
