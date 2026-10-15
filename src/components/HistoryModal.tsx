import React, { useState } from 'react';
import { 
  X, 
  History as HistoryIcon, 
  UserCheck, 
  RotateCcw, 
  PlusCircle, 
  Calendar, 
  Download, 
  Search, 
  Smartphone,
  Building2,
  Clock
} from 'lucide-react';
import { AssignmentHistory, MobileRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AssignmentHistory[];
  specificRecord?: MobileRecord | null;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  specificRecord
}) => {
  if (!isOpen) return null;

  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(item => {
    // If opened for a specific record
    if (specificRecord && item.phoneNumber !== specificRecord.phoneNumber) {
      return false;
    }

    if (filterAction !== 'all' && item.action !== filterAction) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPhone = item.phoneNumber.toLowerCase().includes(q);
      const matchName = item.employeeName.toLowerCase().includes(q);
      const matchEmp = item.employeeId?.toLowerCase().includes(q);
      const matchDept = item.department?.toLowerCase().includes(q);
      const matchPurpose = item.purpose?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);

      if (!(matchPhone || matchName || matchEmp || matchDept || matchPurpose || matchNotes)) {
        return false;
      }
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'History ID',
      'Mobile Number',
      'Action',
      'Employee Name',
      'Employee ID',
      'Department',
      'Assignment Date',
      'Return Date',
      'Purpose',
      'Notes',
      'Timestamp'
    ];

    const rows = filteredHistory.map(h => [
      `"${h.id}"`,
      `"${h.phoneNumber}"`,
      `"${h.action}"`,
      `"${h.employeeName}"`,
      `"${h.employeeId || ''}"`,
      `"${h.department || ''}"`,
      `"${h.assignmentDate || ''}"`,
      `"${h.returnDate || ''}"`,
      `"${(h.purpose || '').replace(/"/g, '""')}"`,
      `"${(h.notes || '').replace(/"/g, '""')}"`,
      `"${h.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = specificRecord 
      ? `history_${specificRecord.phoneNumber.replace(/\D/g, '')}.csv` 
      : `assignment_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <UserCheck className="w-3 h-3 text-indigo-600" /> Assigned
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" /> Returned
          </span>
        );
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3 h-3 text-emerald-600" /> Registered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {specificRecord 
                  ? `Assignment History for ${specificRecord.phoneNumber}` 
                  : 'Global Assignment & Return Audit Trail'}
              </h3>
              <p className="text-xs text-slate-500">
                {specificRecord 
                  ? `Historical custody records for line (${specificRecord.carrier})` 
                  : 'Immutable change logs stored in Google Sheets'}
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

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              {['all', 'assigned', 'returned'].map(act => (
                <button
                  key={act}
                  onClick={() => setFilterAction(act)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                    filterAction === act
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* History Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredHistory.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {filteredHistory.map((item, idx) => (
                <div key={item.id || idx} className="relative pl-6 group">
                  {/* Timeline bullet dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                    item.action === 'assigned'
                      ? 'bg-indigo-600'
                      : item.action === 'returned'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`} />

                  {/* Card */}
                  <div className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs transition-all">
                    
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(item.action)}
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {item.phoneNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {item.timestamp ? item.timestamp.split('T')[0] : 'Historical'}
                      </span>
                    </div>

                    {/* Employee & Dept */}
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{item.employeeName}</span>
                        {item.employeeId && (
                          <span className="text-slate-400 font-mono text-[11px]">({item.employeeId})</span>
                        )}
                        {item.department && (
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-medium text-[11px]">
                            {item.department}
                          </span>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        {item.assignmentDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Assigned: <strong className="text-slate-700">{item.assignmentDate}</strong>
                          </span>
                        )}
                        {item.returnDate && (
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-amber-500" />
                            Returned: <strong className="text-slate-700">{item.returnDate}</strong>
                          </span>
                        )}
                      </div>

                      {/* Purpose */}
                      {item.purpose && (
                        <div className="text-xs text-slate-600 pt-1">
                          <strong className="text-slate-700">Purpose:</strong> {item.purpose}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 mt-2 italic">
                          "{item.notes}"
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No history entries found matching criteria.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{filteredHistory.length} audit entries</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
