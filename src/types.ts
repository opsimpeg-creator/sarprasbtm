export type JenisRuangan =
  | 'Ruang Kelas'
  | 'Laboratorium'
  | 'Bengkel'
  | 'Kantor'
  | 'Perpustakaan'
  | 'Fasilitas Umum'
  | 'Lapangan'
  | 'Toilet'
  | 'Lainnya';

export type KondisiBarang = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Tidak Layak';

export interface SiteplanPosisi {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
  shape?: 'rect' | 'circle' | 'polygon';
  points?: string; // For custom polygon building shape
}

export interface Room {
  id: string; // e.g., 'ROOM-001'
  kode_ruangan: string; // e.g., 'R-101'
  nama_ruangan: string; // e.g., 'Ruang Kelas X TKJ 1'
  jenis_ruangan: JenisRuangan;
  lantai: number;
  posisi_siteplan: SiteplanPosisi;
  deskripsi: string;
  foto?: string;
  status: 'Aktif' | 'Maintenance' | 'Nonaktif';
  created_at?: string;
  updated_at?: string;
}

export interface Sarpras {
  id: string; // e.g., 'SRP-001'
  room_id: string; // e.g., 'ROOM-001'
  nama_barang: string;
  kategori: string; // e.g., 'Elektronik', 'Mebel', 'Alat Praktek'
  merk: string;
  spesifikasi: string;
  jumlah: number;
  satuan: string; // e.g., 'Unit', 'Buah', 'Set'
  kondisi: KondisiBarang;
  tahun_pengadaan: string;
  sumber_dana: string;
  keterangan: string;
  foto?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUser {
  id: string;
  nama: string;
  username?: string;
  email: string;
  password_hash?: string;
  role: 'Super Admin' | 'Petugas Sarpras' | 'Viewer';
  status: 'Aktif' | 'Nonaktif';
  created_at?: string;
  updated_at?: string;
}

export interface AdminSession {
  uid: string;
  email: string;
  displayName: string;
  role: 'Super Admin' | 'Petugas Sarpras' | 'Viewer';
}

export interface StatsSummary {
  totalRooms: number;
  totalSarpras: number;
  totalItemsCount: number;
  baikCount: number;
  rusakRinganCount: number;
  rusakBeratCount: number;
  tidakLayakCount: number;
  lastUpdated: string;
  isSyncedWithSheets: boolean;
}

export interface FilterState {
  searchQuery: string;
  selectedJenis: string; // 'Semua' or specific JenisRuangan
  selectedKondisi: string; // 'Semua' or specific KondisiBarang
  selectedRoomId: string | null;
}

export type DecorationType = 'road_h' | 'road_v' | 'tree' | 'flagpole';

export interface SiteplanDecorationItem {
  id: string;
  type: DecorationType;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface SiteplanDecorations {
  flagpole: { x: number; y: number };
  roadMain: { x: number; y: number; width: number; height: number };
  roadV1: { x: number; y: number; width: number; height: number };
  roadV2: { x: number; y: number; width: number; height: number };
  tree1: { x: number; y: number };
  tree2: { x: number; y: number };
  tree3: { x: number; y: number };
}

export const DEFAULT_DECORATION_ITEMS: SiteplanDecorationItem[] = [
  { id: 'flagpole', type: 'flagpole', name: '🚩 Tiang Bendera & Lapangan Upacara', x: 410, y: 100 },
  { id: 'roadMain', type: 'road_h', name: '🛣️ Jalan Utama (Horizontal)', x: 40, y: 240, width: 740, height: 15 },
  { id: 'roadV1', type: 'road_v', name: '🚶 Jalan Lintas 1 (Vertikal)', x: 250, y: 40, width: 12, height: 440 },
  { id: 'roadV2', type: 'road_v', name: '🚶 Jalan Lintas 2 (Vertikal)', x: 525, y: 40, width: 12, height: 440 },
  { id: 'tree1', type: 'tree', name: '🌳 Taman / Pohon 1', x: 265, y: 100 },
  { id: 'tree2', type: 'tree', name: '🌳 Taman / Pohon 2', x: 510, y: 100 },
  { id: 'tree3', type: 'tree', name: '🌳 Taman / Pohon 3', x: 410, y: 200 },
];

export function loadDecorationItems(): SiteplanDecorationItem[] {
  const saved = localStorage.getItem('smk_siteplan_decorations');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        const items: SiteplanDecorationItem[] = [];
        if (parsed.flagpole) items.push({ id: 'flagpole', type: 'flagpole', name: '🚩 Tiang Bendera', x: parsed.flagpole.x, y: parsed.flagpole.y });
        if (parsed.roadMain) items.push({ id: 'roadMain', type: 'road_h', name: '🛣️ Jalan Utama (Horizontal)', x: parsed.roadMain.x, y: parsed.roadMain.y, width: parsed.roadMain.width || 740, height: parsed.roadMain.height || 15 });
        if (parsed.roadV1) items.push({ id: 'roadV1', type: 'road_v', name: '🚶 Jalan Lintas 1 (Vertikal)', x: parsed.roadV1.x, y: parsed.roadV1.y, width: parsed.roadV1.width || 12, height: parsed.roadV1.height || 440 });
        if (parsed.roadV2) items.push({ id: 'roadV2', type: 'road_v', name: '🚶 Jalan Lintas 2 (Vertikal)', x: parsed.roadV2.x, y: parsed.roadV2.y, width: parsed.roadV2.width || 12, height: parsed.roadV2.height || 440 });
        if (parsed.tree1) items.push({ id: 'tree1', type: 'tree', name: '🌳 Taman / Pohon 1', x: parsed.tree1.x, y: parsed.tree1.y });
        if (parsed.tree2) items.push({ id: 'tree2', type: 'tree', name: '🌳 Taman / Pohon 2', x: parsed.tree2.x, y: parsed.tree2.y });
        if (parsed.tree3) items.push({ id: 'tree3', type: 'tree', name: '🌳 Taman / Pohon 3', x: parsed.tree3.x, y: parsed.tree3.y });
        return items;
      }
    } catch (e) {}
  }
  return DEFAULT_DECORATION_ITEMS;
}

export const DEFAULT_DECORATIONS: SiteplanDecorations = {
  flagpole: { x: 410, y: 100 },
  roadMain: { x: 40, y: 240, width: 740, height: 15 },
  roadV1: { x: 250, y: 40, width: 12, height: 440 },
  roadV2: { x: 525, y: 40, width: 12, height: 440 },
  tree1: { x: 265, y: 100 },
  tree2: { x: 510, y: 100 },
  tree3: { x: 410, y: 200 },
};

export interface AppSettings {
  kopSekolahUrl: string;
  namaInstansi: string;
  namaSekolah: string;
  alamatSekolah: string;
  kontakSekolah: string;
  kepalaSekolahNama: string;
  kepalaSekolahNip: string;
  kepalaSekolahJabatan: string;
  pengelolaSarprasNama: string;
  pengelolaSarprasNip: string;
  pengelolaSarprasJabatan: string;
  // Landing Page Tentang Settings
  aboutBadgeText: string;
  aboutTagText: string;
  aboutDeskripsi: string;
  aboutCard1Judul: string;
  aboutCard1Isi: string;
  aboutCard2Judul: string;
  aboutCard2Isi: string;
  aboutCard3Judul: string;
  aboutCard3Isi: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  kopSekolahUrl: '',
  namaInstansi: 'PEMERINTAH PROVINSI KALIMANTAN SELATAN',
  namaSekolah: 'SMK NEGERI 1 BATUMANDI',
  alamatSekolah: 'Jl. A. Yani Km. 2.5, Batumandi, Kabupaten Balangan, Kalimantan Selatan 71663',
  kontakSekolah: 'Website: smkn1batumandi.sch.id | Email: info@smkn1batumandi.sch.id',
  kepalaSekolahNama: 'H. Kastalani, S.Pd, M.Pd',
  kepalaSekolahNip: '19720512 199802 1 003',
  kepalaSekolahJabatan: 'Kepala SMKN 1 Batumandi',
  pengelolaSarprasNama: 'Herman Syaufi, S.Kom',
  pengelolaSarprasNip: '19880914 201503 1 002',
  pengelolaSarprasJabatan: 'Pengelola Sarana & Prasarana',
  // Landing Page Tentang Defaults
  aboutBadgeText: 'Profil Sekolah Resmi',
  aboutTagText: 'Kabupaten Balangan',
  aboutDeskripsi: 'Sekolah Menengah Kejuruan Negeri unggulan di Kabupaten Balangan, Kalimantan Selatan.',
  aboutCard1Judul: 'Program Keahlian Utama',
  aboutCard1Isi: 'Teknik Komputer & Jaringan (TKJ)\nTeknik Kendaraan Ringan (TKR)\nTeknik Pengelasan (TPL)\nAgribisnis & Teknologi Pertanian',
  aboutCard2Judul: 'Lokasi & Kontak',
  aboutCard2Isi: 'Jl. A. Yani, Batumandi, Kab. Balangan, Kalimantan Selatan 71663.\nEmail: info@smkn1batumandi.sch.id',
  aboutCard3Judul: 'Sistem Sarpras Terpadu',
  aboutCard3Isi: 'Aplikasi Siteplan & Sarpras memudahkan inventarisasi peralatan, pemantauan kondisi gedung, serta transparansi sarana belajar siswa.',
};

export function loadAppSettings(): AppSettings {
  const saved = localStorage.getItem('smk_app_settings');
  if (saved) {
    try {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveAppSettingsToStorage(settings: AppSettings): void {
  localStorage.setItem('smk_app_settings', JSON.stringify(settings));
  window.dispatchEvent(new Event('appSettingsUpdated'));
}

