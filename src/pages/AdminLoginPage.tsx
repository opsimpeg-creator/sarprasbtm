import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Info, ArrowLeft } from 'lucide-react';
import { loginAdmin, AdminSession } from '../firebase/config';

interface AdminLoginPageProps {
  onSuccess: (session: AdminSession) => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBackToHome }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const session = await loginAdmin(identifier, password);
      onSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali email/username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden text-slate-900">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-700" />

        {/* Branding Header */}
        <div className="text-center space-y-3 mb-8 pt-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-indigo-700 flex items-center justify-center shadow-md text-white font-bold text-2xl">
            B
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-700 tracking-widest uppercase">
              SMKN 1 BATUMANDI
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Login Admin Sarpras
            </h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Autentikasi langsung dengan Akun Database Spreadsheet SMKN 1 Batumandi
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email atau Username Administrator
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
            </p>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memverifikasi Akun...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Masuk ke Dashboard Admin
              </>
            )}
          </button>
        </form>

        {/* Back to Home Button */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Siteplan Publik
          </button>
        </div>

      </div>

    </div>
  );
};
