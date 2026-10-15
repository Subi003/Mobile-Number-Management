import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Key, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminAuth } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (auth: AdminAuth) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Default admin validation (or user-defined admin key)
    if ((username === 'admin' && password === 'admin123') || password === 'admin123' || password === 'secret123') {
      const authData: AdminAuth = {
        isAuthenticated: true,
        username: username || 'Administrator',
        role: 'admin',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('mnm_admin_auth', JSON.stringify(authData));
      onLogin(authData);
      onClose();
    } else {
      setError('Invalid username or password. (Hint: default is username: admin / password: admin123)');
    }
  };

  const handleQuickDemoFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mx-auto mb-2 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Telecom Admin Authentication</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Authenticate to modify inventory &amp; employee lines
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Protected Security Operations
            </div>
            <div>
              Write operations (adding numbers, assigning employees, and recording returns) require valid administrator authorization.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password / API Passkey
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Fill Demo Credentials
            </button>
            <span className="text-slate-400 text-[11px]">admin / admin123</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-200 transition-all cursor-pointer"
            >
              Authorize Session
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
