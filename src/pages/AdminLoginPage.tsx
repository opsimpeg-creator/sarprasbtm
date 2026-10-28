import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Building2, Key, Info, Sparkles } from 'lucide-react';
import { loginAdmin, AdminSession } from '../firebase/config';

interface AdminLoginPageProps {
  onSuccess: (session: AdminSession) => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('admin@smkn1batumandi.sch.id');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const session = await loginAdmin(email, password);
      onSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden text-slate-900">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-700" />

        {/* Branding Header */}
        <div className="text-center space-y-3 mb-8 pt-2">
          <div className="w-14 h-14 mx-auto rounded-lg bg-indigo-700 flex items-center justify-center shadow-sm text-white font-bold text-2xl">
            B
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-700 tracking-widest uppercase">
              SMKN 1 BATUMANDI
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Login Admin Sarpras
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Akses terproteksi Firebase Authentication & Google Sheets Database
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 font-medium">
            <Info className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Administrator
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smkn1batumandi.sch.id"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Masuk ke Dashboard Admin
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Selector */}
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Akun Demo Pengujian:
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Password: admin123</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@smkn1batumandi.sch.id', 'Petugas Sarpras')}
              className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-700">
                Petugas Sarpras
              </div>
              <div className="text-[10px] text-slate-500 truncate">admin@smkn1batumandi.sch.id</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('hermansyaufi96@admin.smk.belajar.id', 'Super Admin')}
              className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-indigo-700">
                Super Admin
              </div>
              <div className="text-[10px] text-slate-500 truncate">hermansyaufi96@...</div>
            </button>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onBackToHome}
            className="text-xs text-slate-600 hover:text-indigo-700 transition-colors font-semibold underline"
          >
            &larr; Kembali ke Siteplan Publik
          </button>
        </div>

      </div>

    </div>
  );
};
