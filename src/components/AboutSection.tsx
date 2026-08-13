import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Sparkles, Building2, Info } from 'lucide-react';
import { loadAppSettings, AppSettings } from '../types';
import { getAppSettings } from '../services/apiService';

export const AboutSection: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    let mounted = true;
    getAppSettings().then(s => {
      if (mounted && s) setSettings(s);
    }).catch(e => console.error(e));

    const handleUpdate = () => {
      setSettings(loadAppSettings());
    };
    window.addEventListener('appSettingsUpdated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('appSettingsUpdated', handleUpdate);
    };
  }, []);

  const card1Lines = (settings.aboutCard1Isi || '').split('\n').filter(Boolean);
  const card2Lines = (settings.aboutCard2Isi || '').split('\n').filter(Boolean);
  const card3Lines = (settings.aboutCard3Isi || '').split('\n').filter(Boolean);

  const initialLetter = settings.namaSekolah ? settings.namaSekolah.trim().charAt(0) : 'B';

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      
      {/* School Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-slate-200">
          <div className="w-16 h-16 rounded-xl bg-indigo-700 flex items-center justify-center shadow-md text-white font-black text-2xl shrink-0">
            {initialLetter}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {settings.aboutBadgeText && (
                <span className="text-xs font-bold text-indigo-700 tracking-widest uppercase">
                  {settings.aboutBadgeText}
                </span>
              )}
              {settings.aboutTagText && (
                <span className="px-2.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 font-bold uppercase">
                  {settings.aboutTagText}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">
              {settings.namaSekolah || 'SMKN 1 Batumandi'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {settings.aboutDeskripsi || 'Sekolah Menengah Kejuruan Negeri unggulan di Kabupaten Balangan, Kalimantan Selatan.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 leading-relaxed">
          {/* Card 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              {settings.aboutCard1Judul || 'Program Keahlian Utama'}
            </h4>
            {card1Lines.length > 1 ? (
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                {card1Lines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600 whitespace-pre-line">{settings.aboutCard1Isi}</p>
            )}
          </div>

          {/* Card 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              {settings.aboutCard2Judul || 'Lokasi & Kontak'}
            </h4>
            <div className="text-slate-600 whitespace-pre-line space-y-1">
              {card2Lines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              {settings.aboutCard3Judul || 'Sistem Sarpras Terpadu'}
            </h4>
            <div className="text-slate-600 whitespace-pre-line leading-relaxed">
              {settings.aboutCard3Isi}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
