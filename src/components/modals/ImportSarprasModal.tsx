import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Room, Sarpras } from '../../types';
import { bulkImportSarpras } from '../../services/apiService';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  FileText,
  Loader2,
  Layers,
  ArrowRight,
  Info,
  Trash2,
  Building2,
  RotateCcw
} from 'lucide-react';

interface ParsedImportRow {
  index: number;
  nama_barang: string;
  room_id: string;
  matchedRoomName: string;
  isRoomMatched: boolean;
  rawRoomInput: string;
  kategori: string;
  merk: string;
  spesifikasi: string;
  jumlah: number;
  satuan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Tidak Layak';
  tahun_pengadaan: string;
  sumber_dana: string;
  keterangan: string;
  isValid: boolean;
  validationErrors: string[];
}

interface ImportSarprasModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onSuccess: () => void;
}

export const ImportSarprasModal: React.FC<ImportSarprasModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successResult, setSuccessResult] = useState<{ count: number; message: string } | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'merge'>('append');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [previewPage, setPreviewPage] = useState(1);
  const rowsPerPage = 8;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // 1. Download Official Excel Template with Instructions and Valid Rooms Sheet
  const handleDownloadExcelTemplate = () => {
    // Sheet 1: Example Data
    const templateData = [
      {
        'Kode Ruangan': 'LAB-RPL-1',
        'Nama Barang': 'PC Client All-In-One Intel Core i5',
        'Kategori': 'Elektronik / Komputer',
        'Merk': 'Lenovo',
        'Spesifikasi': 'Core i5-11400, RAM 16GB, SSD 512GB, Layar 21.5 Inch',
        'Jumlah': 25,
        'Satuan': 'Unit',
        'Kondisi': 'Baik',
        'Tahun Pengadaan': '2023',
        'Sumber Dana': 'DAK Fisik SMK',
        'Keterangan': 'Lab Komputer RPL 1'
      },
      {
        'Kode Ruangan': 'LAB-RPL-1',
        'Nama Barang': 'Proyektor HDMI High Brightness',
        'Kategori': 'Elektronik',
        'Merk': 'Epson',
        'Spesifikasi': 'EB-X500 3600 Lumens',
        'Jumlah': 1,
        'Satuan': 'Unit',
        'Kondisi': 'Baik',
        'Tahun Pengadaan': '2022',
        'Sumber Dana': 'BOS Reguler',
        'Keterangan': 'Terpasang di plafon lab'
      },
      {
        'Kode Ruangan': 'LAB-TKJ-1',
        'Nama Barang': 'Switch Manageable 24 Port Gigabit',
        'Kategori': 'Jaringan',
        'Merk': 'Cisco',
        'Spesifikasi': 'SG250-28 Gigabit',
        'Jumlah': 2,
        'Satuan': 'Unit',
        'Kondisi': 'Baik',
        'Tahun Pengadaan': '2022',
        'Sumber Dana': 'BOS Reguler',
        'Keterangan': 'Rack Server TKJ'
      },
      {
        'Kode Ruangan': 'R-TEO-01',
        'Nama Barang': 'Kursi Siswa Futura Steel',
        'Kategori': 'Mebel / Mebeler',
        'Merk': 'Futura',
        'Spesifikasi': 'Rangka Pipa Besi, Bantalan Busa Tebal',
        'Jumlah': 36,
        'Satuan': 'Buah',
        'Kondisi': 'Baik',
        'Tahun Pengadaan': '2021',
        'Sumber Dana': 'Komite Sekolah',
        'Keterangan': 'Ruang Teori'
      },
      {
        'Kode Ruangan': 'AULA-UTAMA',
        'Nama Barang': 'Sound System Active Array 15 Inch',
        'Kategori': 'Audio System',
        'Merk': 'Baretone',
        'Spesifikasi': '15 Inch Active Speaker + Mic Wireless',
        'Jumlah': 2,
        'Satuan': 'Set',
        'Kondisi': 'Rusak Ringan',
        'Tahun Pengadaan': '2021',
        'Sumber Dana': 'BOS Reguler',
        'Keterangan': 'Perlu perbaikan mic receiver'
      }
    ];

    // Sheet 2: Daftar Ruangan Resmi SMKN 1 Batumandi
    const roomsReference = rooms.map(r => ({
      'ID Ruangan': r.id,
      'Kode Ruangan (Gunakan Kolom Ini)': r.kode_ruangan,
      'Nama Ruangan': r.nama_ruangan,
      'Jenis Ruangan': r.jenis_ruangan,
      'Lantai': r.lantai,
      'Status': r.status || 'Aktif'
    }));

    const wb = XLSX.utils.book_new();
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    const wsRooms = XLSX.utils.json_to_sheet(roomsReference);

    // Set column widths for readability
    wsTemplate['!cols'] = [
      { wch: 16 }, // Kode Ruangan
      { wch: 32 }, // Nama Barang
      { wch: 22 }, // Kategori
      { wch: 15 }, // Merk
      { wch: 35 }, // Spesifikasi
      { wch: 10 }, // Jumlah
      { wch: 10 }, // Satuan
      { wch: 14 }, // Kondisi
      { wch: 16 }, // Tahun Pengadaan
      { wch: 18 }, // Sumber Dana
      { wch: 25 }  // Keterangan
    ];

    wsRooms['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 35 },
      { wch: 20 },
      { wch: 10 },
      { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'DATA_SARPRAS');
    XLSX.utils.book_append_sheet(wb, wsRooms, 'DAFTAR_RUANGAN_VALID');

    XLSX.writeFile(wb, 'TEMPLATE_IMPORT_SARPRAS_SMKN1_BATUMANDI.xlsx');
  };

  // 2. Download Simple CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Kode Ruangan,Nama Barang,Kategori,Merk,Spesifikasi,Jumlah,Satuan,Kondisi,Tahun Pengadaan,Sumber Dana,Keterangan\n' +
      'LAB-RPL-1,PC Client All-In-One Intel Core i5,Elektronik / Komputer,Lenovo,"Core i5-11400, RAM 16GB",25,Unit,Baik,2023,DAK Fisik SMK,Lab Komputer RPL 1\n' +
      'LAB-TKJ-1,Switch Manageable 24 Port Gigabit,Jaringan,Cisco,SG250-28 Gigabit,2,Unit,Baik,2022,BOS Reguler,Rack Server TKJ\n' +
      'R-TEO-01,Kursi Siswa Futura Steel,Mebel / Mebeler,Futura,Rangka Pipa Besi,36,Buah,Baik,2021,Komite Sekolah,Ruang Teori\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'TEMPLATE_IMPORT_SARPRAS_SMKN1_BATUMANDI.csv';
    link.click();
  };

  // Helper to match column headers dynamically
  const findValue = (row: Record<string, any>, possibleKeys: string[]): any => {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const pk of possibleKeys) {
        if (normalizedKey === pk.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          return row[key];
        }
      }
    }
    return '';
  };

  // Match room from user input
  const matchRoom = (input: string): { roomId: string; roomName: string; isMatched: boolean } => {
    if (!input || !input.trim()) {
      const defaultRoom = rooms[0] || { id: 'ROOM-001', nama_ruangan: 'Ruangan Default' };
      return { roomId: defaultRoom.id, roomName: defaultRoom.nama_ruangan, isMatched: false };
    }

    const cleanInput = input.trim().toLowerCase();

    // 1. Exact ID match (e.g. ROOM-001)
    const byId = rooms.find(r => r.id.toLowerCase() === cleanInput);
    if (byId) return { roomId: byId.id, roomName: byId.nama_ruangan, isMatched: true };

    // 2. Exact Kode Ruangan match (e.g. LAB-RPL-1)
    const byCode = rooms.find(r => r.kode_ruangan.toLowerCase() === cleanInput);
    if (byCode) return { roomId: byCode.id, roomName: byCode.nama_ruangan, isMatched: true };

    // 3. Exact Nama Ruangan match
    const byName = rooms.find(r => r.nama_ruangan.toLowerCase() === cleanInput);
    if (byName) return { roomId: byName.id, roomName: byName.nama_ruangan, isMatched: true };

    // 4. Substring / contains match
    const bySub = rooms.find(r =>
      cleanInput.includes(r.kode_ruangan.toLowerCase()) ||
      r.nama_ruangan.toLowerCase().includes(cleanInput) ||
      cleanInput.includes(r.nama_ruangan.toLowerCase())
    );
    if (bySub) return { roomId: bySub.id, roomName: bySub.nama_ruangan, isMatched: true };

    // Fallback
    const fallback = rooms[0] || { id: 'ROOM-001', nama_ruangan: 'Ruangan Default' };
    return { roomId: fallback.id, roomName: fallback.nama_ruangan, isMatched: false };
  };

  // Normalize Condition
  const normalizeCondition = (raw: string): 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Tidak Layak' => {
    const s = String(raw || '').toLowerCase().trim();
    if (s.includes('ringan')) return 'Rusak Ringan';
    if (s.includes('berat')) return 'Rusak Berat';
    if (s.includes('tidak') || s.includes('afkir') || s.includes('rusak total')) return 'Tidak Layak';
    return 'Baik';
  };

  // Process Raw Rows
  const processRawData = (rows: Record<string, any>[]) => {
    const processed: ParsedImportRow[] = [];

    rows.forEach((row, i) => {
      // Extract values with flexible header aliases
      const rawNama = findValue(row, ['nama_barang', 'nama barang', 'namabarang', 'nama', 'barang', 'item']) || '';
      const rawRoom = findValue(row, ['kode_ruangan', 'koderuangan', 'kode ruangan', 'room_id', 'roomid', 'ruangan', 'nama_ruangan', 'ruang', 'lokasi']) || '';
      const rawKategori = findValue(row, ['kategori', 'category', 'jenis']) || 'Fasilitas';
      const rawMerk = findValue(row, ['merk', 'merek', 'brand']) || '-';
      const rawSpek = findValue(row, ['spesifikasi', 'spek', 'spec', 'spesifikasi barang']) || '-';
      const rawJumlah = findValue(row, ['jumlah', 'qty', 'kuantitas', 'total']) || 1;
      const rawSatuan = findValue(row, ['satuan', 'unit', 'uom']) || 'Unit';
      const rawKondisi = findValue(row, ['kondisi', 'status_kondisi', 'kondisi barang']) || 'Baik';
      const rawTahun = findValue(row, ['tahun_pengadaan', 'tahun', 'thn', 'tahun pembelian']) || new Date().getFullYear().toString();
      const rawDana = findValue(row, ['sumber_dana', 'sumberdana', 'sumber dana', 'anggaran']) || 'BOS Reguler';
      const rawKet = findValue(row, ['keterangan', 'ket', 'catatan', 'notes']) || '';

      const namaBarang = String(rawNama).trim();
      if (!namaBarang && Object.values(row).every(v => !v)) {
        // Skip purely empty lines
        return;
      }

      const match = matchRoom(String(rawRoom));
      const parsedJumlah = parseInt(String(rawJumlah).replace(/[^0-9]/g, ''), 10) || 1;
      const condition = normalizeCondition(String(rawKondisi));

      const errors: string[] = [];
      if (!namaBarang) errors.push('Nama barang kosong');
      if (!match.isMatched && rawRoom) errors.push(`Ruangan "${rawRoom}" tidak terdaftar resmi`);
      if (parsedJumlah <= 0) errors.push('Jumlah unit harus lebih dari 0');

      processed.push({
        index: i + 1,
        nama_barang: namaBarang || 'Barang Tanpa Nama',
        room_id: match.roomId,
        matchedRoomName: match.roomName,
        isRoomMatched: match.isMatched,
        rawRoomInput: String(rawRoom || '-'),
        kategori: String(rawKategori).trim() || 'Fasilitas',
        merk: String(rawMerk).trim() || '-',
        spesifikasi: String(rawSpek).trim() || '-',
        jumlah: parsedJumlah,
        satuan: String(rawSatuan).trim() || 'Unit',
        kondisi: condition,
        tahun_pengadaan: String(rawTahun).trim() || new Date().getFullYear().toString(),
        sumber_dana: String(rawDana).trim() || 'BOS Reguler',
        keterangan: String(rawKet).trim(),
        isValid: errors.length === 0,
        validationErrors: errors
      });
    });

    setParsedRows(processed);
    setPreviewPage(1);
    if (processed.length === 0) {
      setErrorMsg('File yang dipilih tidak berisi baris data sarana prasarana yang valid.');
    } else {
      setErrorMsg('');
    }
  };

  // Handle File Input Change
  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg('');
    setSuccessResult(null);
    setIsProcessingFile(true);

    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsProcessingFile(false);
          processRawData(results.data as Record<string, any>[]);
        },
        error: (err) => {
          setIsProcessingFile(false);
          setErrorMsg(`Gagal membaca file CSV: ${err.message}`);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
          setIsProcessingFile(false);
          processRawData(jsonData);
        } catch (err: any) {
          setIsProcessingFile(false);
          setErrorMsg(`Gagal membaca file Excel: ${err.message || 'Format tidak didukung'}`);
        }
      };
      reader.onerror = () => {
        setIsProcessingFile(false);
        setErrorMsg('Gagal membaca file dari penyimpanan lokal.');
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setIsProcessingFile(false);
      setErrorMsg('Format file tidak didukung. Mohon gunakan file .xlsx, .xls, atau .csv');
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Update room mapping for a specific row manually in preview table
  const handleRowRoomChange = (rowIndex: number, newRoomId: string) => {
    const roomObj = rooms.find(r => r.id === newRoomId);
    setParsedRows(prev => prev.map(r => {
      if (r.index === rowIndex) {
        return {
          ...r,
          room_id: newRoomId,
          matchedRoomName: roomObj ? roomObj.nama_ruangan : r.matchedRoomName,
          isRoomMatched: true,
          validationErrors: r.validationErrors.filter(err => !err.includes('tidak terdaftar'))
        };
      }
      return r;
    }));
  };

  // Delete row from preview
  const handleDeleteRow = (index: number) => {
    setParsedRows(prev => prev.filter(r => r.index !== index));
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setErrorMsg('');
    setSuccessResult(null);
    setPreviewPage(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Bulk Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const itemsToImport: Partial<Sarpras>[] = parsedRows.map(row => ({
        nama_barang: row.nama_barang,
        room_id: row.room_id,
        kategori: row.kategori,
        merk: row.merk,
        spesifikasi: row.spesifikasi,
        jumlah: row.jumlah,
        satuan: row.satuan,
        kondisi: row.kondisi,
        tahun_pengadaan: row.tahun_pengadaan,
        sumber_dana: row.sumber_dana,
        keterangan: row.keterangan
      }));

      const res = await bulkImportSarpras(itemsToImport, importMode);

      setSuccessResult({
        count: (res.insertedCount || 0) + (res.updatedCount || 0),
        message: res.message || 'Import data sarana prasarana berhasil diselesaikan.'
      });

      // Notify parent to refresh list
      onSuccess();
    } catch (err: any) {
      console.error('Import failed:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered rows for preview pagination
  const filteredRows = parsedRows.filter(r => {
    if (previewFilter === 'valid') return r.isRoomMatched && r.isValid;
    if (previewFilter === 'invalid') return !r.isRoomMatched || !r.isValid;
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const currentPage = Math.min(previewPage, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const validCount = parsedRows.filter(r => r.isRoomMatched && r.isValid).length;
  const warningCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Import Data Sarana & Prasarana
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 uppercase">
                  Excel / CSV
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Unggah massal data inventaris dengan pencocokan otomatis 48 ruangan SMKN 1 Batumandi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Success Banner */}
          {successResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="font-extrabold text-emerald-900 text-sm">
                  Proses Import Selesai Berhasil!
                </div>
                <div className="text-xs text-emerald-700 leading-relaxed">
                  {successResult.message} Data inventaris telah diperbarui pada sistem dan otomatis dikirimkan ke Google Sheets.
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  >
                    Tutup & Lihat Data
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors"
                  >
                    Import File Lain
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Download Templates */}
          {!successResult && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Gunakan Format Template Resmi
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadExcelTemplate}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    title="Download template Excel (.xlsx) beserta daftar 48 ruangan valid"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Template (.XLSX)</span>
                  </button>

                  <button
                    onClick={handleDownloadCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                    title="Download format CSV sederhana"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Format (.CSV)</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Template Excel dilengkapi dengan <strong>Sheet 1 (Contoh Data)</strong> dan <strong>Sheet 2 (Daftar 48 Ruangan Resmi SMKN 1 Batumandi)</strong> agar Anda tidak salah mengetik kode ruangan.
              </p>
            </div>
          )}

          {/* STEP 2: File Upload / Dropzone */}
          {!successResult && parsedRows.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Pilih File Data Inventaris (.xlsx, .xls, .csv)
                </h4>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  {isProcessingFile ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {isProcessingFile ? 'Membaca dan memvalidasi isi file...' : 'Klik untuk memilih file atau seret file ke sini'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung format Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) atau <strong>.csv</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 3: Preview Table & Controls (When file has been parsed) */}
          {!successResult && parsedRows.length > 0 && (
            <div className="space-y-4">
              
              {/* File Info Bar & Metrics */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{file?.name}</span>
                  <span className="text-slate-500">
                    ({((file?.size || 0) / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px]">
                    Total: <strong className="text-slate-900">{parsedRows.length}</strong> barang
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200">
                    Siap Import: <strong>{validCount}</strong>
                  </span>
                  {warningCount > 0 && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] border border-amber-200">
                      Perlu Dicek: <strong>{warningCount}</strong>
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Ganti File"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Import Options (Append vs Merge) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Tambahkan Semua Sebagai Barang Baru</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Menambahkan setiap baris sebagai data inventaris baru dengan ID unik (SRP-xxx).
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Sinkronkan / Perbarui Barang Serupa</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Jika nama barang dan ruangan sudah ada, data lama akan diperbarui (update).
                    </p>
                  </div>
                </label>
              </div>

              {/* Filter Tabs for Preview */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setPreviewFilter('all'); setPreviewPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      previewFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => { setPreviewFilter('valid'); setPreviewPage(1); }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      previewFilter === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  {warningCount > 0 && (
                    <button
                      onClick={() => { setPreviewFilter('invalid'); setPreviewPage(1); }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        previewFilter === 'invalid'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Peringatan ({warningCount})
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-semibold">
                  Hal {currentPage} dari {totalPages}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[320px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 uppercase text-[10px] text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5 text-center w-10">No</th>
                        <th className="p-2.5">Nama Barang</th>
                        <th className="p-2.5">Lokasi Ruangan Terpilih</th>
                        <th className="p-2.5 text-center">Jumlah</th>
                        <th className="p-2.5">Kondisi</th>
                        <th className="p-2.5">Sumber Dana</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right w-10">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {pagedRows.map((row) => (
                        <tr key={row.index} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                            {row.index}
                          </td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{row.nama_barang}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                              {row.merk} - {row.spesifikasi}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="space-y-1">
                              <select
                                value={row.room_id}
                                onChange={(e) => handleRowRoomChange(row.index, e.target.value)}
                                className={`text-[11px] font-medium border rounded px-2 py-1 max-w-[200px] truncate ${
                                  row.isRoomMatched
                                    ? 'border-slate-300 bg-white text-slate-800'
                                    : 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                                }`}
                              >
                                {rooms.map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.kode_ruangan} - {r.nama_ruangan}
                                  </option>
                                ))}
                              </select>
                              {!row.isRoomMatched && row.rawRoomInput !== '-' && (
                                <div className="text-[10px] text-amber-700 italic">
                                  Teks asal: "{row.rawRoomInput}"
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800">
                            {row.jumlah} <span className="text-[10px] text-slate-500 font-normal">{row.satuan}</span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.kondisi === 'Baik'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.kondisi === 'Rusak Ringan'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}>
                              {row.kondisi}
                            </span>
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-600 truncate max-w-[100px]">
                            {row.sumber_dana}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.isRoomMatched && row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Siap
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title={row.validationErrors.join(', ')}>
                                <AlertTriangle className="w-3 h-3" /> Cek Ruangan
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleDeleteRow(row.index)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Hapus baris ini dari import"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Menampilkan baris {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredRows.length)} dari {filteredRows.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setPreviewPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Batal
          </button>

          {!successResult && parsedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-all"
              >
                Ganti File
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={isSubmitting || parsedRows.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Sistem &amp; Sheets...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Proses &amp; Import ({parsedRows.length} Barang)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
