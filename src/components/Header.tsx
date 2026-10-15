import React from 'react';
import { 
  Smartphone, 
  FileSpreadsheet, 
  Github, 
  Plus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { GoogleSheetsConfig, AdminAuth } from '../types';

interface HeaderProps {
  config: GoogleSheetsConfig;
  auth: AdminAuth;
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenSheetsSetup: () => void;
  onOpenGitHubGuide: () => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  auth,
  isSyncing,
  onRefresh,
  onOpenSheetsSetup,
  onOpenGitHubGuide,
  onOpenAddModal,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  TeleTrack
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Mobile Inventory
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Enterprise SIM & Number Allocation Manager
              </p>
            </div>
          </div>

          {/* Sync status indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSheetsSetup}
              className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-medium border transition-colors ${
                config.isConnected && !config.useDemoData
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click to configure Google Sheets API"
            >
              <FileSpreadsheet className={`w-4 h-4 ${config.isConnected && !config.useDemoData ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden md:inline">
                {config.isConnected && !config.useDemoData ? 'Sheets Connected' : 'Demo Mode (Local)'}
              </span>
              <span className={`w-2 h-2 rounded-full ${
                config.isConnected && !config.useDemoData ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
            </button>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Sync / Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* GitHub Pages Guide Button */}
            <button
              onClick={onOpenGitHubGuide}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              title="GitHub Pages Free Hosting Instructions"
            >
              <Github className="w-3.5 h-3.5 text-slate-800" />
              <span>Deploy to GitHub</span>
            </button>

            {/* Auth lock / unlock */}
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  title={`Logged in as ${auth.username} (${auth.role}). Click to logout.`}
                >
                  <Unlock className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                title="Admin Login to authorize changes"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Add Number Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Number</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
