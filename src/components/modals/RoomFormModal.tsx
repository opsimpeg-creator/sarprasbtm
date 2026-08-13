import React, { useState, useEffect } from 'react';
import { Room, JenisRuangan } from '../../types';
import { X, Building2, Save, MapPin, Image as ImageIcon } from 'lucide-react';

interface RoomFormModalProps {
  isOpen: boolean;
  roomToEdit: Room | null;
  onClose: () => void;
  onSave: (roomData: Partial<Room>) => Promise<void>;
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  roomToEdit,
  onClose,
  onSave
}) => {
  const [kodeRuangan, setKodeRuangan] = useState('');
  const [namaRuangan, setNamaRuangan] = useState('');
  const [jenisRuangan, setJenisRuangan] = useState<JenisRuangan>('Ruang Kelas');
  const [lantai, setLantai] = useState(1);
  const [deskripsi, setDeskripsi] = useState('');
  const [foto, setFoto] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Maintenance' | 'Nonaktif'>('Aktif');
  
  // Position properties
  const [posX, setPosX] = useState(200);
  const [posY, setPosY] = useState(200);
  const [posW, setPosW] = useState(120);
  const [posH, setPosH] = useState(80);
  const [posColor, setPosColor] = useState('#2563eb');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roomToEdit) {
      setKodeRuangan(roomToEdit.kode_ruangan || '');
      setNamaRuangan(roomToEdit.nama_ruangan || '');
      setJenisRuangan(roomToEdit.jenis_ruangan || 'Ruang Kelas');
      setLantai(roomToEdit.lantai || 1);
      setDeskripsi(roomToEdit.deskripsi || '');
      setFoto(roomToEdit.foto || '');
      setStatus(roomToEdit.status || 'Aktif');

      const pos = roomToEdit.posisi_siteplan || {};
      setPosX(pos.x ?? 200);
      setPosY(pos.y ?? 200);
      setPosW(pos.width ?? 120);
      setPosH(pos.height ?? 80);
      setPosColor(pos.color ?? '#2563eb');
    } else {
      setKodeRuangan('');
      setNamaRuangan('');
      setJenisRuangan('Ruang Kelas');
      setLantai(1);
      setDeskripsi('');
      setFoto('');
      setStatus('Aktif');
      setPosX(200);
      setPosY(200);
      setPosW(120);
      setPosH(80);
      setPosColor('#2563eb');
    }
  }, [roomToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: roomToEdit?.id,
        kode_ruangan: kodeRuangan,
        nama_ruangan: namaRuangan,
        jenis_ruangan: jenisRuangan,
        lantai: Number(lantai),
        deskripsi,
        foto,
        status,
        posisi_siteplan: {
          x: Number(posX),
          y: Number(posY),
          width: Number(posW),
          height: Number(posH),
          color: posColor
        }
      });
      onClose();
    } catch (err) {
      alert('Gagal menyimpan data ruangan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-indigo-900 text-white border-b border-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-700 text-white rounded-lg shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {roomToEdit ? 'Edit Data Ruangan' : 'Tambah Ruangan Baru'}
              </h3>
              <p className="text-xs text-indigo-200">SMKN 1 Batumandi - Google Sheets Database Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-indigo-200 hover:text-white rounded-lg bg-indigo-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs bg-white text-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Kode Ruangan</label>
              <input
                type="text"
                required
                placeholder="misal: ROOM-015 / RK-TKJ-10"
                value={kodeRuangan}
                onChange={(e) => setKodeRuangan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Ruangan / Gedung</label>
              <input
                type="text"
                required
                placeholder="misal: Laboratorium Komputer TKJ 3"
                value={namaRuangan}
                onChange={(e) => setNamaRuangan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Jenis Ruangan</label>
              <select
                value={jenisRuangan}
                onChange={(e) => setJenisRuangan(e.target.value as JenisRuangan)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              >
                <option value="Ruang Kelas">Ruang Kelas</option>
                <option value="Laboratorium">Laboratorium</option>
                <option value="Bengkel">Bengkel</option>
                <option value="Kantor">Kantor</option>
                <option value="Perpustakaan">Perpustakaan</option>
                <option value="Fasilitas Umum">Fasilitas Umum</option>
                <option value="Lapangan">Lapangan</option>
                <option value="Toilet">Toilet</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Lantai</label>
              <input
                type="number"
                min="1"
                max="5"
                value={lantai}
                onChange={(e) => setLantai(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Status Ruangan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Maintenance' | 'Nonaktif')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              >
                <option value="Aktif">Aktif (Dapat Digunakan)</option>
                <option value="Maintenance">Maintenance (Pemeliharaan)</option>
                <option value="Nonaktif">Non-Aktif / Ditutup</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Deskripsi Ruangan</label>
            <textarea
              rows={3}
              placeholder="Jelaskan fungsi utama ruangan ini..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Foto Ruangan (URL Gambar)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          {/* Siteplan Position Settings */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-indigo-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Posisi & Tampilan pada Siteplan Canvas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-slate-500 text-[10px] mb-1 font-bold">Posisi X</label>
                <input
                  type="number"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] mb-1 font-bold">Posisi Y</label>
                <input
                  type="number"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] mb-1 font-bold">Lebar (W)</label>
                <input
                  type="number"
                  value={posW}
                  onChange={(e) => setPosW(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] mb-1 font-bold">Tinggi (H)</label>
                <input
                  type="number"
                  value={posH}
                  onChange={(e) => setPosH(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] mb-1 font-bold">Warna Shape</label>
                <input
                  type="color"
                  value={posColor}
                  onChange={(e) => setPosColor(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded cursor-pointer p-0.5"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Ruangan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
