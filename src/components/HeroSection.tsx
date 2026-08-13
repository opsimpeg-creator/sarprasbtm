import React from 'react';
import { Search, MapPin, Building2, Sparkles, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { StatsSummary } from '../types';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: StatsSummary | null;
  onScrollToSiteplan: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  stats,
  onScrollToSiteplan
}) => {
  return (
    <div className="relative bg-slate-50 text-slate-900 pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200 overflow-hidden">
      
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-80 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center space-y-5 relative z-10">
        
        {/* School Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold tracking-wide shadow-sm">
          <Building2 className="w-4 h-4 text-indigo-700" />
          <span>SMKN 1 BATUMANDI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          <span className="text-slate-600 font-medium">Kabupaten Balangan</span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-indigo-950 leading-tight">
            SITEPLAN SARANA DAN PRASARANA
          </h1>
          <p className="text-base sm:text-lg font-bold text-indigo-700 max-w-2xl mx-auto">
            Informasi Sarana dan Prasarana SMKN 1 Batumandi
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Jelajahi fasilitas dan sarana prasarana SMKN 1 Batumandi melalui siteplan interaktif.
          </p>
        </div>

        {/* Search Input Control */}
        <div className="max-w-2xl mx-auto pt-1">
          <div className="relative shadow-sm group">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Cari ruangan atau sarpras (misal: 'Ruang Kelas', 'Komputer', 'Bengkel TKR', 'Proyektor')..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-md mr-1 font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onScrollToSiteplan}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition-all shrink-0 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Lihat Siteplan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats Badges */}
        <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
          
          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{stats ? stats.totalRooms : 15}</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Gedung & Ruangan</div>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{stats ? stats.totalSarpras : 21}</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{stats ? stats.totalItemsCount : 308} Total Unit Barang</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-700">{stats ? stats.baikCount : 295} Unit</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Kondisi Baik</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
