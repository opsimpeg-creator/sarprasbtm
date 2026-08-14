import React, { useState } from 'react';
import { Room, Sarpras, KondisiBarang } from '../types';
import { X, Building, Package, Layers, Calendar, CheckCircle2, AlertTriangle, AlertCircle, XCircle, Search, Image as ImageIcon, Sparkles, ExternalLink } from 'lucide-react';

interface RoomDetailModalProps {
  room: Room | null;
  sarprasList: Sarpras[];
  onClose: () => void;
}

const KONDISI_BADGES: Record<KondisiBarang, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  'Baik': {
    label: 'Baik',
    bg: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    text: 'Baik',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
  },
  'Rusak Ringan': {
    label: 'Rusak Ringan',
    bg: 'bg-amber-100 border-amber-200 text-amber-800',
    text: 'Rusak Ringan',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
  },
  'Rusak Berat': {
    label: 'Rusak Berat',
    bg: 'bg-orange-100 border-orange-200 text-orange-800',
    text: 'Rusak Berat',
    icon: <AlertCircle className="w-3.5 h-3.5 text-orange-700" />
  },
  'Tidak Layak': {
    label: 'Tidak Layak',
    bg: 'bg-rose-100 border-rose-200 text-rose-800',
    text: 'Tidak Layak',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-700" />
  }
};

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, sarprasList, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kondisiFilter, setKondisiFilter] = useState<string>('Semua');

  if (!room) return null;

  const filteredSarpras = sarprasList.filter((item) => {
    const matchesSearch =
      item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.spesifikasi.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKondisi = kondisiFilter === 'Semua' || item.kondisi === kondisiFilter;

    return matchesSearch && matchesKondisi;
  });

  const totalItems = sarprasList.reduce((sum, item) => sum + item.jumlah, 0);
  const baikCount = sarprasList.filter(s => s.kondisi === 'Baik').reduce((sum, i) => sum + i.jumlah, 0);
  const rusakCount = totalItems - baikCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-indigo-900 text-white border-b border-indigo-800 flex items-start justify-between relative">
          <div className="space-y-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-700 text-white font-mono font-extrabold text-xs rounded-md shadow-sm">
                {room.kode_ruangan}
              </span>
              <span className="px-2.5 py-1 bg-indigo-800/80 text-indigo-100 border border-indigo-700 text-xs font-semibold rounded-md">
                {room.jenis_ruangan}
              </span>
              <span className="px-2.5 py-1 bg-indigo-800/80 text-indigo-100 border border-indigo-700 text-xs font-semibold rounded-md">
                Lantai {room.lantai}
              </span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md border flex items-center gap-1 ${
                room.status === 'Maintenance'
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : room.status === 'Nonaktif'
                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                  : 'bg-emerald-100 text-emerald-950 border-emerald-300'
              }`}>
                {room.status === 'Maintenance' && '🔧 Maintenance (Pemeliharaan)'}
                {room.status === 'Nonaktif' && '⛔ Non-Aktif'}
                {(!room.status || room.status === 'Aktif') && '✅ Status: Aktif'}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {room.nama_ruangan}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed max-w-2xl">
              {room.deskripsi || 'Tidak ada deskripsi tambahan untuk ruangan ini.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-indigo-800/80 hover:bg-indigo-700 text-indigo-200 hover:text-white transition-colors border border-indigo-700 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Image Banner if available */}
        {room.foto && (
          <div className="w-full h-48 sm:h-56 overflow-hidden relative group bg-slate-100 border-b border-slate-200">
            <img
              src={room.foto}
              alt={room.nama_ruangan}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 text-xs font-medium text-white flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-300" />
              Foto Ruangan SMKN 1 Batumandi
            </div>
          </div>
        )}

        {/* Modal Stats Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">Total Jenis Barang: </span>
              <span className="font-extrabold text-slate-900">{sarprasList.length} Barang</span>
            </div>
            <div>
              <span className="text-slate-500">Total Unit: </span>
              <span className="font-extrabold text-indigo-700">{totalItems} Unit</span>
            </div>
            <div>
              <span className="text-slate-500">Kondisi Baik: </span>
              <span className="font-extrabold text-emerald-700">{baikCount} Unit</span>
            </div>
            {rusakCount > 0 && (
              <div>
                <span className="text-slate-500">Perlu Perhatian: </span>
                <span className="font-extrabold text-amber-700">{rusakCount} Unit</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body - Sarpras List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-white">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Daftar Sarana & Prasarana
            </h3>

            {/* Search and Condition Filter inside modal */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari barang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <select
                value={kondisiFilter}
                onChange={(e) => setKondisiFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="Semua">Semua Kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Tidak Layak">Tidak Layak</option>
              </select>
            </div>
          </div>

          {/* Table / Cards of Sarpras */}
          {filteredSarpras.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">
                {sarprasList.length === 0
                  ? 'Belum ada data sarana dan prasarana untuk ruangan ini.'
                  : 'Tidak ditemukan barang sarpras yang sesuai dengan pencarian/filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Kategori & Merk</th>
                    <th className="p-3">Spesifikasi</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3">Kondisi</th>
                    <th className="p-3">Pengadaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSarpras.map((item, index) => {
                    const badge = KONDISI_BADGES[item.kondisi] || KONDISI_BADGES['Baik'];
                    return (
                      <tr key={`modal-srp-row-${item.id || 's'}-${index}`} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 text-xs">{item.nama_barang}</div>
                          {item.keterangan && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.keterangan}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-semibold">{item.kategori}</div>
                          <div className="text-[11px] text-slate-500">{item.merk || '-'}</div>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs leading-relaxed">
                          {item.spesifikasi || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold text-xs">
                            {item.jumlah} {item.satuan}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${badge.bg}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          <div>Tahun: {item.tahun_pengadaan || '-'}</div>
                          <div className="text-slate-400">Dana: {item.sumber_dana || '-'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Data tersinkronisasi otomatis dengan Google Spreadsheet Database
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>

    </div>
  );
};
