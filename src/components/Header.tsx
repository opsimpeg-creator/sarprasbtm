import React from 'react';
import { Building2, ShieldCheck, RefreshCw, MapPin, Search, LayoutDashboard, LogIn, LogOut, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { AdminSession, logoutAdmin } from '../firebase/config';

interface HeaderProps {
  currentTab: 'home' | 'siteplan' | 'about' | 'admin';
  setCurrentTab: (tab: 'home' | 'siteplan' | 'about' | 'admin') => void;
  adminSession: AdminSession | null;
  onLogout: () => void;
  lastUpdated?: string;
  isSyncing?: boolean;
  onRefreshSheets?: () => void;
  spreadsheetId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  adminSession,
  onLogout,
  lastUpdated,
  isSyncing,
  onRefreshSheets,
  spreadsheetId = '1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0'
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Identity */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-md bg-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-indigo-800 transition-colors">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg leading-none text-indigo-900 group-hover:text-indigo-700 transition-colors">
                  SMKN 1 BATUMANDI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full">
                  Official
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                Siteplan & Sarpras System
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          {currentTab === 'admin' && adminSession ? (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-bold border border-slate-800 shadow-xs">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Panel Dashboard Admin</span>
            </div>
          ) : (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setCurrentTab('home')}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  currentTab === 'home'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60'
                }`}
              >
                Siteplan & Beranda
              </button>
              <button
                onClick={() => setCurrentTab('about')}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  currentTab === 'about'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60'
                }`}
              >
                Tentang
              </button>
              {adminSession && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    currentTab === 'admin'
                      ? 'bg-slate-900 text-white shadow-sm font-bold'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-200/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard Admin
                </button>
              )}
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Admin Login / Logout */}
            {adminSession ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-900">{adminSession.displayName}</div>
                  <div className="text-[10px] text-indigo-600 font-semibold uppercase">{adminSession.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-bold transition-all"
                  title="Logout Admin"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('admin')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
