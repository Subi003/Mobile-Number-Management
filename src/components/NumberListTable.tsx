import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  UserCheck, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  History, 
  Download, 
  Smartphone, 
  Calendar, 
  Tag, 
  Building2, 
  User, 
  FileText,
  AlertCircle,
  MoreVertical,
  X
} from 'lucide-react';
import { MobileRecord, StatusType } from '../types';
import { POPULAR_CARRIERS, DEPARTMENTS } from '../services/mockData';

interface NumberListTableProps {
  records: MobileRecord[];
  activeStatusFilter: string;
  activeDeptFilter: string;
  onStatusFilterChange: (status: string) => void;
  onDeptFilterChange: (dept: string) => void;
  onAssign: (record: MobileRecord) => void;
  onReturn: (record: MobileRecord) => void;
  onEdit: (record: MobileRecord) => void;
  onDelete: (record: MobileRecord) => void;
  onViewHistory: (record: MobileRecord) => void;
  onOpenGlobalHistory: () => void;
}

export const NumberListTable: React.FC<NumberListTableProps> = ({
  records,
  activeStatusFilter,
  activeDeptFilter,
  onStatusFilterChange,
  onDeptFilterChange,
  onAssign,
  onReturn,
  onEdit,
  onDelete,
  onViewHistory,
  onOpenGlobalHistory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [sortField, setSortField] = useState<'phoneNumber' | 'assignedTo' | 'assignmentDate' | 'status'>('phoneNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter & Search logic
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Status filter
      if (activeStatusFilter !== 'all' && record.status !== activeStatusFilter) {
        return false;
      }

      // Department filter
      if (activeDeptFilter !== 'all' && record.department !== activeDeptFilter) {
        return false;
      }

      // Carrier filter
      if (carrierFilter !== 'all' && record.carrier !== carrierFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = record.phoneNumber.toLowerCase().includes(query);
        const matchPerson = record.assignedTo?.toLowerCase().includes(query);
        const matchEmpId = record.employeeId?.toLowerCase().includes(query);
        const matchDept = record.department?.toLowerCase().includes(query);
        const matchPurpose = record.purpose?.toLowerCase().includes(query);
        const matchNotes = record.notes?.toLowerCase().includes(query);
        const matchCarrier = record.carrier?.toLowerCase().includes(query);
        const matchSim = record.simNumber?.toLowerCase().includes(query);

        if (!(matchNumber || matchPerson || matchEmpId || matchDept || matchPurpose || matchNotes || matchCarrier || matchSim)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, activeStatusFilter, activeDeptFilter, carrierFilter, searchQuery, sortField, sortAsc]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Mobile Number',
      'Status',
      'Carrier',
      'SIM Number',
      'Monthly Cost ($)',
      'Assigned Employee',
      'Employee ID',
      'Department',
      'Assignment Date',
      'Purpose',
      'Notes'
    ];

    const rows = filteredRecords.map(r => [
      `"${r.id}"`,
      `"${r.phoneNumber}"`,
      `"${r.status}"`,
      `"${r.carrier}"`,
      `"${r.simNumber || ''}"`,
      r.monthlyCost || 0,
      `"${r.assignedTo || ''}"`,
      `"${r.employeeId || ''}"`,
      `"${r.department || ''}"`,
      `"${r.assignmentDate || ''}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mobile_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Assigned
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Reserved
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Maintenance
          </span>
        );
      default:
        return null;
    }
  };

  const toggleSort = (field: 'phoneNumber' | 'assignedTo' | 'assignmentDate' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      
      {/* Top Controls: Search, Filters & Action Buttons */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search number, name, EMP ID, dept, purpose..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions (Export & Global Audit History) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenGlobalHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="View full assignment & return audit logs"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full Audit History</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Export current view to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Numbers', count: records.length },
              { id: 'available', label: 'Available', count: records.filter(r => r.status === 'available').length },
              { id: 'assigned', label: 'Assigned', count: records.filter(r => r.status === 'assigned').length },
              { id: 'reserved', label: 'Reserved', count: records.filter(r => r.status === 'reserved').length },
              { id: 'maintenance', label: 'Maint.', count: records.filter(r => r.status === 'maintenance').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onStatusFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  activeStatusFilter === tab.id
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 opacity-70 text-[11px]">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Department & Carrier Selectors */}
          <div className="flex items-center gap-2 text-xs">
            {/* Department */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Dept:</span>
              <select
                value={activeDeptFilter}
                onChange={e => onDeptFilterChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Carrier */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium hidden sm:inline">Carrier:</span>
              <select
                value={carrierFilter}
                onChange={e => setCarrierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              >
                <option value="all">All Carriers</option>
                {POPULAR_CARRIERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {(activeStatusFilter !== 'all' || activeDeptFilter !== 'all' || carrierFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  onStatusFilterChange('all');
                  onDeptFilterChange('all');
                  setCarrierFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
            <tr>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('phoneNumber')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Mobile Number</span>
                  {sortField === 'phoneNumber' && (sortAsc ? '↑' : '↓')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === 'status' && (sortAsc ? '↑' : '↓')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('assignedTo')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Assigned Person</span>
                  {sortField === 'assignedTo' && (sortAsc ? '↑' : '↓')}
                </div>
              </th>
              <th className="py-3.5 px-4">
                <span>Department & Purpose</span>
              </th>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('assignmentDate')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Date Assigned</span>
                  {sortField === 'assignmentDate' && (sortAsc ? '↑' : '↓')}
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">
                <span>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => (
                <tr 
                  key={record.id}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  {/* Phone & Carrier */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm tracking-tight font-mono">
                          {record.phoneNumber}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                            {record.carrier}
                          </span>
                          {record.simNumber && (
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[110px]" title={`SIM: ${record.simNumber}`}>
                              SIM: ...{record.simNumber.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>

                  {/* Assigned Person */}
                  <td className="py-3.5 px-4">
                    {record.status === 'assigned' && record.assignedTo ? (
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.assignedTo}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {record.employeeId ? `ID: ${record.employeeId}` : 'No ID registered'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {record.status === 'reserved' ? 'Reserved for project' : 'Unassigned (In Pool)'}
                      </span>
                    )}
                  </td>

                  {/* Department & Purpose */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {record.status === 'assigned' ? (
                      <div>
                        <div className="text-xs font-semibold text-indigo-700 inline-block bg-indigo-50/70 px-2 py-0.5 rounded">
                          {record.department || 'General'}
                        </div>
                        {record.purpose && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1" title={record.purpose}>
                            {record.purpose}
                          </p>
                        )}
                      </div>
                    ) : record.notes ? (
                      <p className="text-xs text-slate-500 line-clamp-1 italic" title={record.notes}>
                        {record.notes}
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>

                  {/* Date Assigned */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                    {record.assignmentDate ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.assignmentDate}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      
                      {/* Assign button */}
                      {(record.status === 'available' || record.status === 'reserved') && (
                        <button
                          onClick={() => onAssign(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                          title="Assign to an employee"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                      )}

                      {/* Return button */}
                      {record.status === 'assigned' && (
                        <button
                          onClick={() => onReturn(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                          title="Return number back to pool"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return</span>
                        </button>
                      )}

                      {/* History icon */}
                      <button
                        onClick={() => onViewHistory(record)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Assignment history"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Edit icon */}
                      <button
                        onClick={() => onEdit(record)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit record details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete icon */}
                      <button
                        onClick={() => onDelete(record)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <Smartphone className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-700">No mobile records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing filters or search terms, or add a new mobile number to your inventory.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Phones & Small Tablets) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <div key={record.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-base font-mono">
                    {record.phoneNumber}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {record.carrier}
                    </span>
                    <span>${record.monthlyCost || 0}/mo</span>
                  </div>
                </div>
                <div>{getStatusBadge(record.status)}</div>
              </div>

              {/* Assignment details */}
              {record.status === 'assigned' && record.assignedTo ? (
                <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>{record.assignedTo}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{record.employeeId}</span>
                  </div>
                  <div className="text-indigo-600 font-medium">
                    {record.department || 'Department Unassigned'}
                  </div>
                  {record.purpose && (
                    <div className="text-slate-600 line-clamp-2">
                      Purpose: {record.purpose}
                    </div>
                  )}
                  {record.assignmentDate && (
                    <div className="text-slate-400 text-[11px] pt-0.5">
                      Assigned on {record.assignmentDate}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  {record.notes || 'No active assignment. Number is idle.'}
                </div>
              )}

              {/* Mobile Card Action Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  {(record.status === 'available' || record.status === 'reserved') && (
                    <button
                      onClick={() => onAssign(record)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-md"
                    >
                      Assign
                    </button>
                  )}
                  {record.status === 'assigned' && (
                    <button
                      onClick={() => onReturn(record)}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-md"
                    >
                      Return
                    </button>
                  )}
                  <button
                    onClick={() => onViewHistory(record)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(record)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(record)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            No records match the current filter.
          </div>
        )}
      </div>

      {/* Footer bar with record counts */}
      <div className="p-3 sm:px-4 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> total numbers
        </span>
        <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
          Format: E.164 / Standard
        </span>
      </div>

    </div>
  );
};
