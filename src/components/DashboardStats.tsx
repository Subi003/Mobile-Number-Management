import React from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Building2
} from 'lucide-react';
import { MobileRecord } from '../types';

interface DashboardStatsProps {
  records: MobileRecord[];
  onFilterByStatus?: (status: string) => void;
  onFilterByDepartment?: (dept: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  records,
  onFilterByStatus,
  onFilterByDepartment
}) => {
  const total = records.length;
  const available = records.filter(r => r.status === 'available').length;
  const assigned = records.filter(r => r.status === 'assigned').length;
  const reserved = records.filter(r => r.status === 'reserved').length;
  const maintenance = records.filter(r => r.status === 'maintenance').length;
  
  const totalCost = records.reduce((acc, r) => acc + (r.monthlyCost || 0), 0);
  const utilization = total > 0 ? Math.round((assigned / total) * 100) : 0;
  const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0;

  // Department counts
  const deptMap: Record<string, number> = {};
  records.forEach(r => {
    if (r.department && r.status === 'assigned') {
      deptMap[r.department] = (deptMap[r.department] || 0) + 1;
    }
  });

  const topDepts = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Numbers */}
        <div 
          onClick={() => onFilterByStatus?.('all')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Numbers
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {total}
            </span>
            <span className="text-xs font-medium text-slate-500">
              SIM records
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>Pool capacity</span>
            <span className="mx-1.5">•</span>
            <span className="font-semibold text-slate-700">${totalCost.toLocaleString()}/mo</span>
          </div>
        </div>

        {/* Available Numbers */}
        <div 
          onClick={() => onFilterByStatus?.('available')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-emerald-100/90 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Available Numbers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {available}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {availabilityRate}% free
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>Ready for instant allocation</span>
          </div>
        </div>

        {/* Assigned Numbers */}
        <div 
          onClick={() => onFilterByStatus?.('assigned')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-100/90 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
              Assigned Numbers
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight">
              {assigned}
            </span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {utilization}% deployed
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>Active employees</span>
          </div>
        </div>

        {/* Reserved & Maintenance */}
        <div 
          onClick={() => onFilterByStatus?.('reserved')}
          className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reserved / Maint.
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {reserved + maintenance}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({reserved} res / {maintenance} maint)
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>Locked or pending testing</span>
          </div>
        </div>

      </div>

      {/* Utilization Bar & Department Tags */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Utilization Bar */}
        <div className="w-full md:w-1/2">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inventory Allocation Ratio</span>
            </span>
            <span className="font-semibold text-slate-800">
              {assigned} Assigned / {available} Free / {reserved + maintenance} Other
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${(assigned / (total || 1)) * 100}%` }}
              className="bg-indigo-600 transition-all duration-500"
              title={`Assigned: ${assigned}`}
            />
            <div 
              style={{ width: `${(available / (total || 1)) * 100}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Available: ${available}`}
            />
            <div 
              style={{ width: `${((reserved + maintenance) / (total || 1)) * 100}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Reserved & Maintenance: ${reserved + maintenance}`}
            />
          </div>
        </div>

        {/* Top Department Chips */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Depts:
          </span>
          {topDepts.length > 0 ? (
            topDepts.map(([dept, count]) => (
              <button
                key={dept}
                onClick={() => onFilterByDepartment?.(dept)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                <span>{dept}</span>
                <span className="bg-white px-1.5 py-0.2 rounded-full text-[10px] font-bold text-slate-600 shadow-2xs">
                  {count}
                </span>
              </button>
            ))
          ) : (
            <span className="text-slate-400 italic">No assigned departments yet</span>
          )}
        </div>

      </div>
    </div>
  );
};
