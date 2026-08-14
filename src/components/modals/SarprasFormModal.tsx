import React, { useState, useEffect } from 'react';
import { Room, Sarpras, KondisiBarang } from '../../types';
import { X, Package, Save } from 'lucide-react';

interface SarprasFormModalProps {
  isOpen: boolean;
  itemToEdit: Sarpras | null;
  rooms: Room[];
  defaultRoomId?: string;
  onClose: () => void;
  onSave: (itemData: Partial<Sarpras>) => Promise<void>;
}

export const SarprasFormModal: React.FC<SarprasFormModalProps> = ({
  isOpen,
  itemToEdit,
  rooms,
  defaultRoomId,
  onClose,
  onSave
}) => {
  const [roomId, setRoomId] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [kategori, setKategori] = useState('Elektronik');
  const [merk, setMerk] = useState('');
  const [spesifikasi, setSpesifikasi] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [satuan, setSatuan] = useState('Unit');
  const [kondisi, setKondisi] = useState<KondisiBarang>('Baik');
  const [tahunPengadaan, setTahunPengadaan] = useState('2023');
  const [sumberDana, setSumberDana] = useState('BOS Reguler');
  const [keterangan, setKeterangan] = useState('');
  const [foto, setFoto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setRoomId(itemToEdit.room_id || rooms[0]?.id || '');
      setNamaBarang(itemToEdit.nama_barang || '');
      setKategori(itemToEdit.kategori || 'Elektronik');
      setMerk(itemToEdit.merk || '');
      setSpesifikasi(itemToEdit.spesifikasi || '');
      setJumlah(itemToEdit.jumlah || 1);
      setSatuan(itemToEdit.satuan || 'Unit');
      setKondisi(itemToEdit.kondisi || 'Baik');
      setTahunPengadaan(itemToEdit.tahun_pengadaan || '2023');
      setSumberDana(itemToEdit.sumber_dana || 'BOS Reguler');
      setKeterangan(itemToEdit.keterangan || '');
      setFoto(itemToEdit.foto || '');
    } else {
      setRoomId(defaultRoomId || rooms[0]?.id || '');
      setNamaBarang('');
      setKategori('Elektronik');
      setMerk('');
      setSpesifikasi('');
      setJumlah(1);
      setSatuan('Unit');
      setKondisi('Baik');
      setTahunPengadaan('2023');
      setSumberDana('BOS Reguler');
      setKeterangan('');
      setFoto('');
    }
  }, [itemToEdit, isOpen, defaultRoomId, rooms]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: itemToEdit?.id,
        room_id: roomId,
        nama_barang: namaBarang,
        kategori,
        merk,
        spesifikasi,
        jumlah: Number(jumlah),
        satuan,
        kondisi,
        tahun_pengadaan: tahunPengadaan,
        sumber_dana: sumberDana,
        keterangan,
        foto
      });
      onClose();
    } catch (err) {
      alert('Gagal menyimpan data sarana prasarana');
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
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {itemToEdit ? 'Edit Barang Sarpras' : 'Tambah Barang Sarpras Baru'}
              </h3>
              <p className="text-xs text-indigo-200">SMKN 1 Batumandi - Relasi ID Ruangan & Sarpras</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-indigo-200 hover:text-white rounded-lg bg-indigo-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs bg-white text-slate-800">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Pilih Lokasi Ruangan (ROOM_ID)</label>
            <select
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
            >
              {rooms.map((r, index) => (
                <option key={`modal-room-opt-${r.id || 'r'}-${index}`} value={r.id}>
                  {r.kode_ruangan} - {r.nama_ruangan} ({r.jenis_ruangan})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Barang</label>
              <input
                type="text"
                required
                placeholder="misal: Komputer Client All-in-One"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kategori Barang</label>
              <input
                type="text"
                placeholder="Elektronik / Mebel / Alat Praktek / dll"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Merk / Brand</label>
              <input
                type="text"
                placeholder="misal: Lenovo / Epson / Chitose / Tekiro"
                value={merk}
                onChange={(e) => setMerk(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kondisi Barang</label>
              <select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value as KondisiBarang)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Tidak Layak">Tidak Layak</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Jumlah</label>
              <input
                type="number"
                min="1"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Satuan</label>
              <input
                type="text"
                placeholder="Unit / Buah / Set / Box"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tahun Pengadaan</label>
              <input
                type="text"
                placeholder="2023"
                value={tahunPengadaan}
                onChange={(e) => setTahunPengadaan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Sumber Dana</label>
              <input
                type="text"
                placeholder="BOS Reguler / DAK Fisik / Komite"
                value={sumberDana}
                onChange={(e) => setSumberDana(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Spesifikasi Detail</label>
            <textarea
              rows={2}
              placeholder="Rincian spesifikasi teknis, tipe, seri..."
              value={spesifikasi}
              onChange={(e) => setSpesifikasi(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Keterangan Tambahan</label>
            <input
              type="text"
              placeholder="Catatan penggunaan atau status perawatan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
