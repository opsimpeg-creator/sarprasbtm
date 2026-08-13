import React, { useState, useEffect } from 'react';
import { Room, Sarpras, StatsSummary, loadAppSettings } from '../types';
import { AdminSession } from '../firebase/config';
import {
  getRooms,
  getAllSarpras,
  getStats,
  createRoom,
  updateRoom,
  deleteRoom,
  createSarpras,
  updateSarpras,
  deleteSarpras,
  syncSheetsData,
  getAdmins,
  pushAllToSheets
} from '../services/apiService';
import { RoomFormModal } from '../components/modals/RoomFormModal';
import { SarprasFormModal } from '../components/modals/SarprasFormModal';
import { SiteplanEditor } from '../components/SiteplanEditor';
import { SettingsTab } from '../components/SettingsTab';
import {
  Building2,
  Package,
  LayoutDashboard,
  FileSpreadsheet,
  MapPin,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
  Copy,
  Check,
  Code,
  FileCode,
  Printer,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  Settings
} from 'lucide-react';

interface AdminDashboardProps {
  adminSession: AdminSession;
  onGoToHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminSession, onGoToHome }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'sarpras' | 'siteplan' | 'sheets' | 'settings'>('overview');

  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sarpras, setSarpras] = useState<Sarpras[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const scriptCode = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT (Code.gs)
 * SISTEM INFORMASI SARANA & PRASARANA - SMKN 1 BATUMANDI
 * ==============================================================================
 * Script ini otomatis membuat sheet ROOMS, SARPRAS, & ADMINS beserta format header dan data awal.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 SMKN 1 Batumandi')
    .addItem('1. Buat / Inisialisasi Database Otomatis', 'setupDatabase')
    .addItem('2. Isi Data Awal Sarpras & Admin SMKN 1 Batumandi', 'seedDataDefault')
    .addToUi();
}

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Sheet ROOMS
  var sheetRooms = ss.getSheetByName('ROOMS') || ss.insertSheet('ROOMS');
  var headersRooms = ['id', 'kode_ruangan', 'nama_ruangan', 'jenis_ruangan', 'lantai', 'posisi_siteplan', 'deskripsi', 'foto', 'status', 'created_at'];
  sheetRooms.getRange(1, 1, 1, headersRooms.length).setValues([headersRooms]);
  sheetRooms.getRange(1, 1, 1, headersRooms.length).setBackground('#1e1b4b').setFontColor('#ffffff').setFontWeight('bold');
  sheetRooms.setFrozenRows(1);

  // 2. Setup Sheet SARPRAS
  var sheetSarpras = ss.getSheetByName('SARPRAS') || ss.insertSheet('SARPRAS');
  var headersSarpras = ['id', 'room_id', 'nama_barang', 'kategori', 'merk', 'spesifikasi', 'kondisi', 'jumlah', 'satuan', 'tahun_pengadaan', 'sumber_dana', 'keterangan', 'foto', 'created_at', 'updated_at'];
  sheetSarpras.getRange(1, 1, 1, headersSarpras.length).setValues([headersSarpras]);
  sheetSarpras.getRange(1, 1, 1, headersSarpras.length).setBackground('#065f46').setFontColor('#ffffff').setFontWeight('bold');
  sheetSarpras.setFrozenRows(1);

  // 3. Setup Sheet ADMINS
  var sheetAdmins = ss.getSheetByName('ADMINS') || ss.insertSheet('ADMINS');
  var headersAdmins = ['id', 'nama', 'username', 'email', 'password_hash', 'role', 'status', 'created_at', 'updated_at'];
  sheetAdmins.getRange(1, 1, 1, headersAdmins.length).setValues([headersAdmins]);
  sheetAdmins.getRange(1, 1, 1, headersAdmins.length).setBackground('#831843').setFontColor('#ffffff').setFontWeight('bold');
  sheetAdmins.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('✅ Berhasil! Database Google Sheets (ROOMS, SARPRAS, & ADMINS) SMKN 1 Batumandi telah dibuat.');
}

function seedDataDefault() {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetRooms = ss.getSheetByName('ROOMS');
  var sheetSarpras = ss.getSheetByName('SARPRAS');
  var sheetAdmins = ss.getSheetByName('ADMINS');

  if (sheetRooms.getLastRow() === 1) {
    sheetRooms.getRange(2, 1, 5, 10).setValues([
      ['ROOM-001', 'LAB-RPL-1', 'Laboratorium RPL 1', 'Laboratorium', 1, '{"x":120,"y":80,"width":140,"height":90,"color":"#3b82f6"}', 'Lab Komputer RPL', '', 'Aktif', new Date().toISOString()],
      ['ROOM-002', 'LAB-TKJ-1', 'Laboratorium TKJ 1', 'Laboratorium', 1, '{"x":280,"y":80,"width":140,"height":90,"color":"#10b981"}', 'Lab Komputer TKJ', '', 'Aktif', new Date().toISOString()],
      ['ROOM-003', 'R-TEO-01', 'Ruang Kelas X RPL 1', 'Ruang Kelas', 2, '{"x":120,"y":200,"width":120,"height":80,"color":"#8b5cf6"}', 'Ruang Teori', '', 'Aktif', new Date().toISOString()],
      ['ROOM-004', 'AULA-UTAMA', 'Aula Utama SMKN 1 Batumandi', 'Aula / Gedung Pertemuan', 1, '{"x":450,"y":80,"width":200,"height":140,"color":"#f59e0b"}', 'Aula Serbaguna', '', 'Aktif', new Date().toISOString()],
      ['ROOM-005', 'PERPUS-01', 'Perpustakaan Digital SMKN 1', 'Perpustakaan', 1, '{"x":450,"y":240,"width":150,"height":100,"color":"#ec4899"}', 'Perpustakaan', '', 'Aktif', new Date().toISOString()]
    ]);
  }

  if (sheetSarpras.getLastRow() === 1) {
    sheetSarpras.getRange(2, 1, 5, 15).setValues([
      ['SRP-001', 'ROOM-001', 'PC Client All-In-One Intel Core i5', 'Elektronik / Komputer', 'Lenovo', 'Core i5-11400, RAM 16GB, SSD 512GB', 'Baik', 25, 'Unit', '2023', 'DAK Fisik SMK', 'Windows 11 & VS Code', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-002', 'ROOM-001', 'Proyektor HDMI High Brightness', 'Elektronik', 'Epson', 'EB-X500 3600 Lumens', 'Baik', 1, 'Unit', '2022', 'BOS Reguler', 'Terpasang di plafon lab', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-003', 'ROOM-002', 'Switch Manageable 24 Port Gigabit', 'Jaringan', 'Cisco', 'SG250-28 Gigabit', 'Baik', 2, 'Unit', '2022', 'BOS Reguler', 'Rack Server TKJ', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-004', 'ROOM-003', 'Kursi Siswa Futura Steel', 'Mebel / Mebeler', 'Futura', 'Rangka Pipa Besi', 'Baik', 36, 'Buah', '2021', 'Komite Sekolah', 'Ruang teori', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-005', 'ROOM-004', 'Sound System Active Array 15 Inch', 'Audio System', 'Baretone', '15 Inch Active Speaker', 'Rusak Ringan', 2, 'Set', '2021', 'BOS Reguler', 'Mic wireless channel 2', '', new Date().toISOString(), new Date().toISOString()]
    ]);
  }

  if (sheetAdmins.getLastRow() === 1) {
    var defaultHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
    sheetAdmins.getRange(2, 1, 2, 9).setValues([
      ['ADM-001', 'Herman Syaufi', 'hermansyaufi96', 'hermansyaufi96@admin.smk.belajar.id', defaultHash, 'Super Admin', 'Aktif', new Date().toISOString(), new Date().toISOString()],
      ['ADM-002', 'Petugas Sarpras SMKN 1 Batumandi', 'admin_sarpras', 'admin@smkn1batumandi.sch.id', defaultHash, 'Petugas Sarpras', 'Aktif', new Date().toISOString(), new Date().toISOString()]
    ]);
  }

  SpreadsheetApp.getUi().alert('🎉 Berhasil mengisi data awal SMKN 1 Batumandi (Termasuk User Admin & Password Hash)!');
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet.toUpperCase() : 'ROOMS';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  var headers = data[0]; var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }
    result.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || 'INSERT';
    var sheetName = (body.sheet || 'ROOMS').toUpperCase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];

    if (action === 'INSERT' && body.data) {
      var row = [];
      for (var k = 0; k < headers.length; k++) {
        var v = body.data[headers[k]];
        if (typeof v === 'object') v = JSON.stringify(v);
        row.push(v !== undefined ? v : '');
      }
      sheet.appendRow(row);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'UPDATE' && body.data && body.data.id) {
      var vals = sheet.getDataRange().getValues();
      var idCol = headers.indexOf('id');
      if (idCol !== -1) {
        for (var r = 1; r < vals.length; r++) {
          if (String(vals[r][idCol]) === String(body.data.id)) {
            for (var c = 0; c < headers.length; c++) {
              if (body.data[headers[c]] !== undefined) {
                var cv = body.data[headers[c]];
                if (typeof cv === 'object') cv = JSON.stringify(cv);
                sheet.getRange(r + 1, c + 1).setValue(cv);
              }
            }
            return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }
    if (action === 'DELETE' && body.id) {
      var dVals = sheet.getDataRange().getValues();
      var idC = headers.indexOf('id');
      if (idC !== -1) {
        for (var idx = dVals.length - 1; idx >= 1; idx--) {
          if (String(dVals[idx][idC]) === String(body.id)) {
            sheet.deleteRow(idx + 1);
            return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Export Handlers for Sarpras Reports
  const handleDownloadSarprasCSV = () => {
    const dataToExport = filteredSarpras.length > 0 ? filteredSarpras : sarpras;
    const headers = [
      'ID',
      'Kode Ruangan',
      'Nama Ruangan',
      'Nama Barang',
      'Kategori',
      'Merk',
      'Spesifikasi',
      'Kondisi',
      'Jumlah',
      'Satuan',
      'Tahun Pengadaan',
      'Sumber Dana',
      'Keterangan'
    ];

    const rows = dataToExport.map(item => {
      const room = rooms.find(r => r.id === item.room_id);
      return [
        item.id,
        room?.kode_ruangan || '-',
        `"${(room?.nama_ruangan || '-').replace(/"/g, '""')}"`,
        `"${(item.nama_barang || '').replace(/"/g, '""')}"`,
        `"${(item.kategori || '').replace(/"/g, '""')}"`,
        `"${(item.merk || '').replace(/"/g, '""')}"`,
        `"${(item.spesifikasi || '').replace(/"/g, '""')}"`,
        item.kondisi || 'Baik',
        item.jumlah || 0,
        item.satuan || 'Unit',
        item.tahun_pengadaan || '-',
        `"${(item.sumber_dana || '-').replace(/"/g, '""')}"`,
        `"${(item.keterangan || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Sarpras_SMKN1_Batumandi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSarprasReport = () => {
    const dataToExport = filteredSarpras.length > 0 ? filteredSarpras : sarpras;
    const appSettings = loadAppSettings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Mohon izinkan pop-up peramban Anda untuk mencetak laporan.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalBarang = dataToExport.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
    const baikCount = dataToExport.filter(i => i.kondisi === 'Baik').reduce((acc, c) => acc + c.jumlah, 0);
    const rusakRinganCount = dataToExport.filter(i => i.kondisi === 'Rusak Ringan').reduce((acc, c) => acc + c.jumlah, 0);
    const rusakBeratCount = dataToExport.filter(i => i.kondisi === 'Rusak Berat' || i.kondisi === 'Tidak Layak').reduce((acc, c) => acc + c.jumlah, 0);

    const rowsHtml = dataToExport.map((item, idx) => {
      const room = rooms.find(r => r.id === item.room_id);
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${item.nama_barang}</b><br><small style="color: #64748b;">${item.spesifikasi || '-'}</small></td>
          <td>${room ? `${room.kode_ruangan} - ${room.nama_ruangan}` : '-'}</td>
          <td>${item.kategori || '-'} / ${item.merk || '-'}</td>
          <td style="text-align: center;"><b>${item.jumlah}</b> ${item.satuan}</td>
          <td style="text-align: center;">
            <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;
              background-color: ${item.kondisi === 'Baik' ? '#dcfce7; color: #166534;' : item.kondisi === 'Rusak Ringan' ? '#fef3c7; color: #92400e;' : '#fee2e2; color: #991b1b;'}">
              ${item.kondisi}
            </span>
          </td>
          <td>${item.sumber_dana || '-'} (${item.tahun_pengadaan || '-'})</td>
        </tr>
      `;
    }).join('');

    const headerContentHtml = appSettings.kopSekolahUrl ? `
      <div class="header" style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px;">
        <img src="${appSettings.kopSekolahUrl}" style="max-height: 100px; max-width: 100%; margin: 0 auto 10px auto; display: block;" alt="Kop Sekolah Header" />
      </div>
    ` : `
      <div class="header">
        <h3>${appSettings.namaInstansi || 'PEMERINTAH PROVINSI KALIMANTAN SELATAN'}</h3>
        <h2>${appSettings.namaSekolah || 'SMK NEGERI 1 BATUMANDI'}</h2>
        <p>${appSettings.alamatSekolah || 'Jl. A. Yani Km. 2.5, Batumandi, Kabupaten Balangan, Kalimantan Selatan 71663'}</p>
        <p>${appSettings.kontakSekolah || 'Website: smkn1batumandi.sch.id | Email: info@smkn1batumandi.sch.id'}</p>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Sarana & Prasarana - ${appSettings.namaSekolah || 'SMKN 1 Batumandi'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
          .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h3 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #334155; }
          .header h2 { margin: 4px 0; font-size: 18px; font-weight: bold; color: #0f172a; }
          .header p { margin: 2px 0; font-size: 11px; color: #475569; }
          .report-title { text-align: center; margin: 20px 0 10px 0; text-transform: uppercase; font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
          .meta-info { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
          th { background-color: #f1f5f9; text-transform: uppercase; font-size: 10px; font-weight: bold; text-align: left; }
          .summary-box { font-size: 11px; margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background-color: #fafafa; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; page-break-inside: avoid; }
          .signature-box { text-align: center; width: 250px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 15px;">
          <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">🖨️ Cetak Laporan / Simpan PDF</button>
        </div>
        
        ${headerContentHtml}

        <div class="report-title">LAPORAN INVENTARIS SARANA DAN PRASARANA</div>
        
        <div class="meta-info">
          <div><strong>Tanggal Laporan:</strong> ${todayStr}</div>
          <div><strong>Filter Ruangan:</strong> ${selectedRoomFilter === 'Semua' ? 'Semua Ruangan' : (rooms.find(r => r.id === selectedRoomFilter)?.nama_ruangan || '-')}</div>
          <div><strong>Filter Kondisi:</strong> ${selectedKondisiFilter}</div>
        </div>

        <div class="summary-box">
          <strong>Ringkasan Data:</strong> ${dataToExport.length} Jenis Barang | <strong>${totalBarang} Total Unit</strong> 
          (<span style="color: #166534; font-weight: bold;">${baikCount} Baik</span>, 
          <span style="color: #92400e; font-weight: bold;">${rusakRinganCount} Rusak Ringan</span>, 
          <span style="color: #991b1b; font-weight: bold;">${rusakBeratCount} Rusak Berat</span>)
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th>Nama Barang &amp; Spesifikasi</th>
              <th>Lokasi Ruangan</th>
              <th>Kategori / Merk</th>
              <th style="text-align: center;">Jumlah</th>
              <th style="text-align: center;">Kondisi</th>
              <th>Sumber Dana (Tahun)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-box">
            <p>Mengetahui,<br>${appSettings.kepalaSekolahJabatan || 'Kepala SMKN 1 Batumandi'}</p>
            <br><br><br><br>
            <p><strong><u>${appSettings.kepalaSekolahNama || 'H. Kastalani, S.Pd, M.Pd'}</u></strong><br>NIP. ${appSettings.kepalaSekolahNip || '-'}</p>
          </div>
          <div class="signature-box">
            <p>Batumandi, ${todayStr}<br>${appSettings.pengelolaSarprasJabatan || 'Pengelola Sarana & Prasarana'}</p>
            <br><br><br><br>
            <p><strong><u>${appSettings.pengelolaSarprasNama || 'Herman Syaufi, S.Kom'}</u></strong><br>NIP. ${appSettings.pengelolaSarprasNip || '-'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Sidebar Toggle State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Search, Filter, & Pagination States
  const [roomQuery, setRoomQuery] = useState('');
  const [roomPage, setRoomPage] = useState(1);
  const [roomPerPage, setRoomPerPage] = useState(10);

  const [sarprasQuery, setSarprasQuery] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('Semua');
  const [selectedKondisiFilter, setSelectedKondisiFilter] = useState('Semua');
  const [sarprasPage, setSarprasPage] = useState(1);
  const [sarprasPerPage, setSarprasPerPage] = useState(10);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setRoomPage(1);
  }, [roomQuery, roomPerPage]);

  useEffect(() => {
    setSarprasPage(1);
  }, [sarprasQuery, selectedRoomFilter, selectedKondisiFilter, sarprasPerPage]);

  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [isSarprasModalOpen, setIsSarprasModalOpen] = useState(false);
  const [editingSarpras, setEditingSarpras] = useState<Sarpras | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsData, sarprasList, statsData, adminsList] = await Promise.all([
        getRooms(),
        getAllSarpras(),
        getStats(),
        getAdmins().catch(() => [])
      ]);
      setRooms(roomsData);
      setSarpras(sarprasList);
      setStats(statsData);
      setAdmins(adminsList);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncSheetsData();
      await loadData();
      alert('Sinkronisasi data Google Spreadsheet berhasil!');
    } catch (err) {
      alert('Gagal sinkronisasi data dengan Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushAllToSheets = async () => {
    setIsPushing(true);
    try {
      const res = await pushAllToSheets();
      alert(`Berhasil! ${res.message}`);
      await loadData();
    } catch (err: any) {
      alert(`Gagal mengirim data ke Google Sheets: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // CRUD Handlers for Rooms
  const handleSaveRoom = async (roomData: Partial<Room>) => {
    if (editingRoom) {
      await updateRoom(editingRoom.id, roomData);
    } else {
      await createRoom(roomData);
    }
    await loadData();
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ruangan "${name}"? Seluruh data sarpras di ruangan ini juga akan terhapus.`)) {
      await deleteRoom(id);
      await loadData();
    }
  };

  // CRUD Handlers for Sarpras
  const handleSaveSarpras = async (itemData: Partial<Sarpras>) => {
    if (editingSarpras) {
      await updateSarpras(editingSarpras.id, itemData);
    } else {
      await createSarpras(itemData);
    }
    await loadData();
  };

  const handleDeleteSarpras = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${name}"?`)) {
      await deleteSarpras(id);
      await loadData();
    }
  };

  // Filtered & Paginated Rooms
  const filteredRooms = rooms.filter(r =>
    r.nama_ruangan.toLowerCase().includes(roomQuery.toLowerCase()) ||
    r.kode_ruangan.toLowerCase().includes(roomQuery.toLowerCase()) ||
    r.jenis_ruangan.toLowerCase().includes(roomQuery.toLowerCase())
  );

  const totalRoomPages = Math.ceil(filteredRooms.length / roomPerPage) || 1;
  const currentRoomPage = Math.min(roomPage, totalRoomPages);
  const roomStartIndex = (currentRoomPage - 1) * roomPerPage;
  const paginatedRooms = filteredRooms.slice(roomStartIndex, roomStartIndex + roomPerPage);

  // Filtered & Paginated Sarpras
  const filteredSarpras = sarpras.filter(s => {
    const matchesQuery =
      s.nama_barang.toLowerCase().includes(sarprasQuery.toLowerCase()) ||
      s.merk.toLowerCase().includes(sarprasQuery.toLowerCase()) ||
      s.spesifikasi.toLowerCase().includes(sarprasQuery.toLowerCase()) ||
      s.kategori.toLowerCase().includes(sarprasQuery.toLowerCase());

    const matchesRoom = selectedRoomFilter === 'Semua' || s.room_id === selectedRoomFilter;
    const matchesKondisi = selectedKondisiFilter === 'Semua' || s.kondisi === selectedKondisiFilter;

    return matchesQuery && matchesRoom && matchesKondisi;
  });

  const totalSarprasPages = Math.ceil(filteredSarpras.length / sarprasPerPage) || 1;
  const currentSarprasPage = Math.min(sarprasPage, totalSarprasPages);
  const sarprasStartIndex = (currentSarprasPage - 1) * sarprasPerPage;
  const paginatedSarpras = filteredSarpras.slice(sarprasStartIndex, sarprasStartIndex + sarprasPerPage);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      {isSidebarOpen && (
        <aside className="w-full md:w-64 bg-slate-900 text-white border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between transition-all duration-300">
          <div className="space-y-6">
            
            {/* Admin Info & Close Sidebar Button */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{adminSession.displayName}</div>
                  <div className="text-[10px] text-indigo-300 font-semibold">{adminSession.role}</div>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Sembunyikan Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Overview & Ringkasan
              </button>

              <button
                onClick={() => setActiveTab('rooms')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'rooms'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Manajemen Ruangan ({rooms.length})
              </button>

              <button
                onClick={() => setActiveTab('sarpras')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sarpras'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                Sarana Prasarana ({sarpras.length})
              </button>

              <button
                onClick={() => setActiveTab('siteplan')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'siteplan'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                Siteplan Layout Editor
              </button>

              <button
                onClick={() => setActiveTab('sheets')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sheets'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Integrasi Google Sheets
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-400" />
                Pengaturan System / Laporan
              </button>
            </nav>

          </div>

          {/* Bottom Sidebar Public Access Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onGoToHome}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-700/60 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 group"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
              <span>Ke Tampilan Publik</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 w-full">
        
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-xl shadow-xs transition-all flex items-center justify-center shrink-0 active:scale-95"
              title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Dashboard Admin Sarpras SMKN 1 Batumandi
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Kelola data ruangan, inventaris barang, dan tata letak siteplan secara dinamis.
              </p>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyingkronkan...' : 'Refresh Google Sheets'}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Ruangan</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{rooms.length}</div>
                <div className="text-[11px] text-indigo-700 mt-2 font-bold">Terdaftar di Siteplan Canvas</div>
                <Building2 className="w-12 h-12 absolute -right-2 -bottom-2 text-slate-100 pointer-events-none" />
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Jenis Sarpras</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{sarpras.length}</div>
                <div className="text-[11px] text-emerald-700 mt-2 font-bold">{stats?.totalItemsCount || 0} Total Unit Barang</div>
                <Package className="w-12 h-12 absolute -right-2 -bottom-2 text-slate-100 pointer-events-none" />
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Kondisi Baik</div>
                <div className="text-3xl font-black text-emerald-700 mt-1">{stats?.baikCount || 0} Unit</div>
                <div className="text-[11px] text-emerald-700 mt-2 font-semibold">Siap digunakan praktek & belajar</div>
                <CheckCircle2 className="w-12 h-12 absolute -right-2 -bottom-2 text-emerald-50 pointer-events-none" />
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Perlu Perbaikan / Rusak</div>
                <div className="text-3xl font-black text-amber-700 mt-1">
                  {(stats?.rusakRinganCount || 0) + (stats?.rusakBeratCount || 0) + (stats?.tidakLayakCount || 0)} Unit
                </div>
                <div className="text-[11px] text-amber-700 mt-2 font-semibold">
                  {stats?.rusakRinganCount || 0} Rusak Ringan | {(stats?.rusakBeratCount || 0) + (stats?.tidakLayakCount || 0)} Rusak Berat
                </div>
                <AlertTriangle className="w-12 h-12 absolute -right-2 -bottom-2 text-amber-50 pointer-events-none" />
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Aksi Cepat Manajemen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setEditingRoom(null);
                    setIsRoomModalOpen(true);
                  }}
                  className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Plus className="w-4 h-4" />
                    Tambah Ruangan
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Tambah data gedung atau lab baru ke siteplan.</p>
                </button>

                <button
                  onClick={() => {
                    setEditingSarpras(null);
                    setIsSarprasModalOpen(true);
                  }}
                  className="p-4 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <Plus className="w-4 h-4" />
                    Tambah Barang Sarpras
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Input inventaris barang baru ke ruangan tertentu.</p>
                </button>

                <button
                  onClick={() => setActiveTab('siteplan')}
                  className="p-4 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    Atur Tata Letak Siteplan
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Gunakan editor visual 2D untuk menggeser posisi gedung.</p>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MANAJEMEN RUANGAN */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari ruangan, kode, atau jenis..."
                    value={roomQuery}
                    onChange={(e) => setRoomQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <select
                  value={roomPerPage}
                  onChange={(e) => setRoomPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 shadow-sm shrink-0"
                >
                  <option value={5}>5 per hal</option>
                  <option value={10}>10 per hal</option>
                  <option value={20}>20 per hal</option>
                  <option value={50}>50 per hal</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingRoom(null);
                  setIsRoomModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Ruangan Baru
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3">Kode & Nama Ruangan</th>
                    <th className="p-3">Jenis Ruangan</th>
                    <th className="p-3">Lantai</th>
                    <th className="p-3">Posisi Siteplan (X, Y, W, H)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                        Tidak ada data ruangan ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded border border-indigo-200">
                              {room.kode_ruangan}
                            </span>
                            <span className="font-bold text-slate-900">{room.nama_ruangan}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">{room.jenis_ruangan}</td>
                        <td className="p-3 text-slate-500">Lantai {room.lantai}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          X:{room.posisi_siteplan?.x}, Y:{room.posisi_siteplan?.y}, W:{room.posisi_siteplan?.width}, H:{room.posisi_siteplan?.height}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border inline-flex items-center gap-1 ${
                            room.status === 'Maintenance'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : room.status === 'Nonaktif'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {room.status === 'Maintenance' && '🔧 '}
                            {room.status === 'Nonaktif' && '⛔ '}
                            {room.status === 'Aktif' && '✅ '}
                            {room.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setIsRoomModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-md"
                            title="Edit Ruangan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.nama_ruangan)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-rose-700 rounded-md"
                            title="Hapus Ruangan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Footer Controls */}
              {filteredRooms.length > 0 && (
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-slate-600 font-medium">
                    Menampilkan <strong className="text-slate-900">{filteredRooms.length === 0 ? 0 : roomStartIndex + 1}</strong> hingga{' '}
                    <strong className="text-slate-900">{Math.min(roomStartIndex + roomPerPage, filteredRooms.length)}</strong> dari{' '}
                    <strong className="text-slate-900">{filteredRooms.length}</strong> total ruangan
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRoomPage(1)}
                      disabled={currentRoomPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Pertama"
                    >
                      <ChevronsLeft className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => setRoomPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentRoomPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-700" />
                    </button>

                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                      Hal {currentRoomPage} dari {totalRoomPages}
                    </div>

                    <button
                      onClick={() => setRoomPage(prev => Math.min(prev + 1, totalRoomPages))}
                      disabled={currentRoomPage === totalRoomPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => setRoomPage(totalRoomPages)}
                      disabled={currentRoomPage === totalRoomPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Terakhir"
                    >
                      <ChevronsRight className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANAJEMEN SARPRAS */}
        {activeTab === 'sarpras' && (
          <div className="space-y-4">
            {/* Laporan & Data Export Banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">Laporan &amp; Data Inventaris Sarpras</h3>
                </div>
                <p className="text-xs text-emerald-100/80 mt-1">
                  Menampilkan <strong>{filteredSarpras.length}</strong> jenis barang ({filteredSarpras.reduce((acc, c) => acc + (c.jumlah || 0), 0)} unit total). Unduh rekapitulasi data inventaris resmi sekolah dalam format PDF (Kop Surat SMKN 1 Batumandi) atau CSV/Excel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handlePrintSarprasReport}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow flex items-center gap-1.5 transition-all active:scale-95"
                  title="Cetak atau simpan Laporan Resmi Sarpras dalam bentuk PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF Laporan Resmi</span>
                </button>

                <button
                  onClick={handleDownloadSarprasCSV}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-500/30 shadow flex items-center gap-1.5 transition-all active:scale-95"
                  title="Unduh seluruh data sarpras dalam format CSV / Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh CSV / Excel</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama barang, merk, spesifikasi..."
                    value={sarprasQuery}
                    onChange={(e) => setSarprasQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 shadow-sm"
                >
                  <option value="Semua">Semua Ruangan</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.kode_ruangan} - {r.nama_ruangan}</option>
                  ))}
                </select>

                <select
                  value={selectedKondisiFilter}
                  onChange={(e) => setSelectedKondisiFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 shadow-sm"
                >
                  <option value="Semua">Semua Kondisi</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                  <option value="Tidak Layak">Tidak Layak</option>
                </select>

                <select
                  value={sarprasPerPage}
                  onChange={(e) => setSarprasPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 shadow-sm shrink-0"
                >
                  <option value={5}>5 per hal</option>
                  <option value={10}>10 per hal</option>
                  <option value={20}>20 per hal</option>
                  <option value={50}>50 per hal</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingSarpras(null);
                  setIsSarprasModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Barang Sarpras
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Lokasi Ruangan</th>
                    <th className="p-3">Kategori & Merk</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3">Kondisi</th>
                    <th className="p-3">Sumber Dana</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedSarpras.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                        Tidak ada barang sarpras ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedSarpras.map((item) => {
                      const roomObj = rooms.find(r => r.id === item.room_id);
                      return (
                        <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.nama_barang}</div>
                            <div className="text-[11px] text-slate-500 max-w-xs truncate">{item.spesifikasi || '-'}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded border border-indigo-200">
                              {roomObj?.kode_ruangan || item.room_id}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-800 font-semibold">{item.kategori}</div>
                            <div className="text-[10px] text-slate-500">{item.merk || '-'}</div>
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-700">
                            {item.jumlah} {item.satuan}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              item.kondisi === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {item.kondisi}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{item.sumber_dana || '-'} ({item.tahun_pengadaan || '-'})</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingSarpras(item);
                                setIsSarprasModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-md"
                              title="Edit Barang"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSarpras(item.id, item.nama_barang)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-rose-700 rounded-md"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination Footer Controls */}
              {filteredSarpras.length > 0 && (
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-slate-600 font-medium">
                    Menampilkan <strong className="text-slate-900">{filteredSarpras.length === 0 ? 0 : sarprasStartIndex + 1}</strong> hingga{' '}
                    <strong className="text-slate-900">{Math.min(sarprasStartIndex + sarprasPerPage, filteredSarpras.length)}</strong> dari{' '}
                    <strong className="text-slate-900">{filteredSarpras.length}</strong> total barang
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSarprasPage(1)}
                      disabled={currentSarprasPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Pertama"
                    >
                      <ChevronsLeft className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => setSarprasPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentSarprasPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-700" />
                    </button>

                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                      Hal {currentSarprasPage} dari {totalSarprasPages}
                    </div>

                    <button
                      onClick={() => setSarprasPage(prev => Math.min(prev + 1, totalSarprasPages))}
                      disabled={currentSarprasPage === totalSarprasPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => setSarprasPage(totalSarprasPages)}
                      disabled={currentSarprasPage === totalSarprasPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman Terakhir"
                    >
                      <ChevronsRight className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SITEPLAN EDITOR */}
        {activeTab === 'siteplan' && (
          <SiteplanEditor rooms={rooms} sarpras={sarpras} onRoomsUpdated={loadData} />
        )}

        {/* TAB 5: INTEGRASI GOOGLE SHEETS */}
        {activeTab === 'sheets' && (
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  Integrasi Google Spreadsheet ID
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Aplikasi terhubung langsung dengan Google Sheets sebagai Database Utama SMKN 1 Batumandi.
                </p>
              </div>

              <a
                href={`https://docs.google.com/spreadsheets/d/1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
              <div>Spreadsheet ID: <span className="text-emerald-400 font-bold">1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0</span></div>
              <div>Sheet ROOMS: <span className="text-indigo-300">{rooms.length} Baris Data Ruangan</span></div>
              <div>Sheet SARPRAS: <span className="text-indigo-300">{sarpras.length} Baris Data Inventaris</span></div>
              <div>Sheet ADMINS: <span className="text-rose-400 font-bold">{admins.length || 2} User Admin &amp; Password Hashed (SHA-256)</span></div>
              <div>Status Sync: <span className="text-emerald-400">Aktif &amp; Sinkron (Google Sheets API Engine + Web App)</span></div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePushAllToSheets}
                disabled={isPushing}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <ShieldCheck className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
                {isPushing ? 'Mengirim Data...' : 'Kirim Data Admin & Hash Password ke Spreadsheet'}
              </button>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Tarik / Tarik Ulang Data Spreadsheet
              </button>

              <a
                href="/api/sheets/export-csv/ADMINS"
                download
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-rose-700" />
                Unduh CSV Sheet ADMINS
              </a>

              <a
                href="/api/sheets/export-csv/ROOMS"
                download
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-indigo-700" />
                Unduh CSV Sheet ROOMS
              </a>

              <a
                href="/api/sheets/export-csv/SARPRAS"
                download
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                Unduh CSV Sheet SARPRAS
              </a>
            </div>

            {/* Google Apps Script (Code.gs) Generator & Downloader */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-600" />
                    Kode Script Otomatis (Code.gs)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Gunakan kode Apps Script ini agar Google Sheets Anda otomatis membuat sheet <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-bold">ROOMS</code> dan <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-bold">SARPRAS</code> beserta datanya.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedScript ? 'Kode Disalin!' : 'Salin Kode Code.gs'}</span>
                  </button>

                  <a
                    href="/Code.gs"
                    download="Code.gs"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File Code.gs</span>
                  </a>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-extrabold text-indigo-900 mb-1">1. Buka Apps Script</div>
                  <div className="text-slate-600">Buka Google Spreadsheet lalu klik menu <strong>Ekstensi &gt; Apps Script</strong>.</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-extrabold text-indigo-900 mb-1">2. Tempelkan Kode</div>
                  <div className="text-slate-600">Hapus isi file bawaan, lalu paste/tempel seluruh kode <strong className="font-mono text-indigo-700">Code.gs</strong> ini.</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-extrabold text-indigo-900 mb-1">3. Simpan &amp; Jalankan</div>
                  <div className="text-slate-600">Klik ikon Simpan (Ctrl+S), lalu jalankan fungsi <strong className="text-emerald-700 font-mono">setupDatabase</strong>.</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-extrabold text-indigo-900 mb-1">4. Menu Otomatis</div>
                  <div className="text-slate-600">Akan muncul menu baru 🚀 <strong>SMKN 1 Batumandi</strong> di atas tampilan Google Sheets!</div>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="bg-slate-950 text-slate-100 rounded-xl p-4 overflow-x-auto max-h-80 border border-slate-800 font-mono text-[11px] leading-relaxed shadow-inner">
                <pre>{scriptCode}</pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            admins={admins}
            onAdminsUpdated={loadData}
          />
        )}

      </main>

      {/* Modals */}
      <RoomFormModal
        isOpen={isRoomModalOpen}
        roomToEdit={editingRoom}
        onClose={() => setIsRoomModalOpen(false)}
        onSave={handleSaveRoom}
      />

      <SarprasFormModal
        isOpen={isSarprasModalOpen}
        itemToEdit={editingSarpras}
        rooms={rooms}
        onClose={() => setIsSarprasModalOpen(false)}
        onSave={handleSaveSarpras}
      />

    </div>
  );
};
