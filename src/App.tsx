/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  DashboardStats 
} from './components/DashboardStats';
import { 
  NumberListTable 
} from './components/NumberListTable';
import { 
  AssignNumberModal 
} from './components/AssignNumberModal';
import { 
  ReturnNumberModal 
} from './components/ReturnNumberModal';
import { 
  AddEditNumberModal 
} from './components/AddEditNumberModal';
import { 
  HistoryModal 
} from './components/HistoryModal';
import { 
  GoogleSheetsSetupModal 
} from './components/GoogleSheetsSetupModal';
import { 
  GitHubPagesGuideModal 
} from './components/GitHubPagesGuideModal';
import { 
  AuthModal 
} from './components/AuthModal';

import { 
  MobileRecord, 
  AssignmentHistory, 
  GoogleSheetsConfig, 
  AdminAuth 
} from './types';

import { 
  getStoredConfig, 
  fetchInventoryRecords, 
  saveMobileRecord, 
  assignMobileRecord, 
  returnMobileRecord, 
  deleteMobileRecord, 
  fetchHistoryRecords 
} from './services/googleSheetsService';

import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileSpreadsheet, 
  ShieldAlert,
  Info
} from 'lucide-react';

export default function App() {
  // App Config & Auth
  const [config, setConfig] = useState<GoogleSheetsConfig>(getStoredConfig);
  const [auth, setAuth] = useState<AdminAuth>(() => {
    try {
      const stored = localStorage.getItem('mnm_admin_auth');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      isAuthenticated: true, // Default authenticated for effortless immediate exploration
      username: 'admin',
      role: 'admin'
    };
  });

  // Data State
  const [records, setRecords] = useState<MobileRecord[]>([]);
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [activeDeptFilter, setActiveDeptFilter] = useState<string>('all');

  // Modals
  const [isSheetsSetupOpen, setIsSheetsSetupOpen] = useState<boolean>(false);
  const [isGitHubGuideOpen, setIsGitHubGuideOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [recordToEdit, setRecordToEdit] = useState<MobileRecord | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false);
  const [recordToAssign, setRecordToAssign] = useState<MobileRecord | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState<boolean>(false);
  const [recordToReturn, setRecordToReturn] = useState<MobileRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [specificHistoryRecord, setSpecificHistoryRecord] = useState<MobileRecord | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Fetch / Sync Data
  const loadData = useCallback(async (currentConfig: GoogleSheetsConfig = config) => {
    setIsSyncing(true);
    try {
      const result = await fetchInventoryRecords(currentConfig);
      setRecords(result.records);

      const histData = await fetchHistoryRecords(currentConfig);
      setHistory(histData);

      if (result.fromGoogleSheets) {
        showToast('Successfully synchronized with Google Sheets.', 'success');
      } else if (result.error) {
        showToast(result.error, 'error');
      }
    } catch (err: any) {
      console.error('Sync failed', err);
      showToast('Data sync encountered an error. Showing offline records.', 'info');
    } finally {
      setIsSyncing(false);
    }
  }, [config, showToast]);

  useEffect(() => {
    loadData();
  }, []);

  // Ensure user is authorized for write operations
  const requireAuth = (callback: () => void) => {
    if (!auth.isAuthenticated) {
      showToast('Admin authorization required to modify employee numbers.', 'error');
      setIsAuthModalOpen(true);
      return;
    }
    callback();
  };

  // Handlers for Workflows
  const handleOpenAdd = () => {
    requireAuth(() => {
      setRecordToEdit(null);
      setIsAddEditOpen(true);
    });
  };

  const handleOpenEdit = (record: MobileRecord) => {
    requireAuth(() => {
      setRecordToEdit(record);
      setIsAddEditOpen(true);
    });
  };

  const handleOpenAssign = (record: MobileRecord) => {
    requireAuth(() => {
      setRecordToAssign(record);
      setIsAssignOpen(true);
    });
  };

  const handleOpenReturn = (record: MobileRecord) => {
    requireAuth(() => {
      setRecordToReturn(record);
      setIsReturnOpen(true);
    });
  };

  const handleDelete = (record: MobileRecord) => {
    requireAuth(async () => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${record.phoneNumber} from the inventory? This action is permanent.`
      );
      if (!confirmDelete) return;

      setIsSyncing(true);
      const res = await deleteMobileRecord(record.id, record.phoneNumber, config);
      setIsSyncing(false);

      if (res.success) {
        showToast(`Deleted ${record.phoneNumber} from inventory.`, 'success');
        loadData();
      } else {
        showToast(res.error || 'Failed deleting record.', 'error');
      }
    });
  };

  const handleSaveRecord = async (savedData: Partial<MobileRecord>) => {
    const res = await saveMobileRecord(savedData, config);
    if (res.success) {
      showToast(
        savedData.id ? `Updated record ${savedData.phoneNumber}` : `Added ${savedData.phoneNumber} to inventory`,
        'success'
      );
      await loadData();
    } else {
      throw new Error(res.error || 'Failed saving record');
    }
  };

  const handleConfirmAssignment = async (data: {
    id: string;
    phoneNumber: string;
    assignedTo: string;
    employeeId: string;
    department: string;
    assignmentDate: string;
    purpose: string;
    notes?: string;
  }) => {
    const res = await assignMobileRecord(data, config);
    if (res.success) {
      showToast(res.message || `Number assigned to ${data.assignedTo}`, 'success');
      await loadData();
    } else {
      throw new Error(res.error || 'Failed assigning number');
    }
  };

  const handleConfirmReturn = async (data: {
    id: string;
    phoneNumber: string;
    returnDate: string;
    notes?: string;
  }) => {
    const res = await returnMobileRecord(data, config);
    if (res.success) {
      showToast(res.message || 'Number returned to available pool.', 'success');
      await loadData();
    } else {
      throw new Error(res.error || 'Failed returning number');
    }
  };

  const handleViewHistory = (record: MobileRecord) => {
    setSpecificHistoryRecord(record);
    setIsHistoryOpen(true);
  };

  const handleOpenGlobalHistory = () => {
    setSpecificHistoryRecord(null);
    setIsHistoryOpen(true);
  };

  const handleSaveConfig = (newConfig: GoogleSheetsConfig) => {
    setConfig(newConfig);
    loadData(newConfig);
    showToast(
      newConfig.isConnected && !newConfig.useDemoData
        ? 'Connected to Google Sheets!'
        : 'Running in Demo Mode',
      'info'
    );
  };

  const handleLogout = () => {
    const loggedOut: AdminAuth = {
      isAuthenticated: false,
      username: '',
      role: 'viewer'
    };
    localStorage.removeItem('mnm_admin_auth');
    setAuth(loggedOut);
    showToast('Logged out of admin session.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
          <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            <div className="flex items-center gap-2.5 text-xs font-medium">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        config={config}
        auth={auth}
        isSyncing={isSyncing}
        onRefresh={() => loadData()}
        onOpenSheetsSetup={() => setIsSheetsSetupOpen(true)}
        onOpenGitHubGuide={() => setIsGitHubGuideOpen(true)}
        onOpenAddModal={handleOpenAdd}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Sub-banner for Google Sheets info */}
      {!config.isConnected || config.useDemoData ? (
        <div className="bg-amber-500/10 border-b border-amber-200/60 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>Demo Mode Active:</strong> Changes are saved locally. Connect your Google Sheet in 2 minutes for permanent multi-user storage!
              </span>
            </div>
            <button
              onClick={() => setIsSheetsSetupOpen(true)}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Connect Google Sheets Now &rarr;</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border-b border-emerald-200/60 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                <strong>Live Google Sheets Sync:</strong> All records and history are saved to your Google Spreadsheet backend.
              </span>
            </div>
            <button
              onClick={() => setIsSheetsSetupOpen(true)}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Dashboard Stats */}
        <DashboardStats
          records={records}
          onFilterByStatus={status => setActiveStatusFilter(status)}
          onFilterByDepartment={dept => setActiveDeptFilter(dept)}
        />

        {/* Inventory Records Table */}
        <NumberListTable
          records={records}
          activeStatusFilter={activeStatusFilter}
          activeDeptFilter={activeDeptFilter}
          onStatusFilterChange={setActiveStatusFilter}
          onDeptFilterChange={setActiveDeptFilter}
          onAssign={handleOpenAssign}
          onReturn={handleOpenReturn}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
          onOpenGlobalHistory={handleOpenGlobalHistory}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">TeleTrack Mobile Manager</span>
            <span>•</span>
            <span>Google Apps Script &amp; Google Sheets Powered</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button
              onClick={() => setIsSheetsSetupOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Sheets Setup
            </button>
            <button
              onClick={() => setIsGitHubGuideOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Deploy to GitHub Pages
            </button>
            <button
              onClick={handleOpenGlobalHistory}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Audit Trail
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AssignNumberModal
        isOpen={isAssignOpen}
        record={recordToAssign}
        onClose={() => {
          setIsAssignOpen(false);
          setRecordToAssign(null);
        }}
        onConfirm={handleConfirmAssignment}
      />

      <ReturnNumberModal
        isOpen={isReturnOpen}
        record={recordToReturn}
        onClose={() => {
          setIsReturnOpen(false);
          setRecordToReturn(null);
        }}
        onConfirm={handleConfirmReturn}
      />

      <AddEditNumberModal
        isOpen={isAddEditOpen}
        recordToEdit={recordToEdit}
        existingRecords={records}
        onClose={() => {
          setIsAddEditOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveRecord}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        specificRecord={specificHistoryRecord}
        onClose={() => {
          setIsHistoryOpen(false);
          setSpecificHistoryRecord(null);
        }}
      />

      <GoogleSheetsSetupModal
        isOpen={isSheetsSetupOpen}
        config={config}
        onClose={() => setIsSheetsSetupOpen(false)}
        onSaveConfig={handleSaveConfig}
      />

      <GitHubPagesGuideModal
        isOpen={isGitHubGuideOpen}
        onClose={() => setIsGitHubGuideOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={newAuth => {
          setAuth(newAuth);
          showToast(`Welcome, ${newAuth.username}! Admin privileges granted.`, 'success');
        }}
      />

    </div>
  );
}
