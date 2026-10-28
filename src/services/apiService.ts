import Papa from 'papaparse';
import { Room, Sarpras, StatsSummary, AdminUser } from '../types';
import { INITIAL_ROOMS, INITIAL_SARPRAS, INITIAL_ADMINS } from '../data/initialData';

const API_BASE = '/api';
const SPREADSHEET_ID = '1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzi4ytGLJtfbDEQqLA-m5MnOTqJsKP5Aj2ALuZyMPhphUPz45o4d1FqvsoeQZt5QC36KA/exec';

const STORAGE_KEY_ROOMS = 'sarpras_cached_rooms_v1';
const STORAGE_KEY_ITEMS = 'sarpras_cached_sarpras_v1';
const STORAGE_KEY_ADMINS = 'sarpras_cached_admins_v1';

// Direct Client-Side Google Sheets CSV Fetcher
async function fetchDirectSheetCSV(sheetName: string): Promise<any[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return (parsed.data as any[]) || [];
  } catch (err) {
    console.warn(`Direct Google Sheet CSV fetch for ${sheetName} failed:`, err);
    return [];
  }
}

// Send mutation directly to Google Apps Script Web App as fallback
async function sendMutationToAppsScript(sheet: string, action: string, data?: any, id?: string) {
  if (!APPS_SCRIPT_URL) return;
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet, action, data, id }),
      redirect: 'follow'
    }).catch(e => console.warn('Apps Script mutation notice:', e));
  } catch (e) {
    console.warn('Apps Script mutation exception:', e);
  }
}

// Local Storage helpers
function getCachedRooms(): Room[] | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (val) return JSON.parse(val);
  } catch (e) {}
  return null;
}

function setCachedRooms(rooms: Room[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  } catch (e) {}
}

function getCachedSarpras(): Sarpras[] | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (val) return JSON.parse(val);
  } catch (e) {}
  return null;
}

function setCachedSarpras(items: Sarpras[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {}
}

function getCachedAdmins(): AdminUser[] | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY_ADMINS);
    if (val) return JSON.parse(val);
  } catch (e) {}
  return null;
}

function setCachedAdmins(admins: AdminUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
  } catch (e) {}
}

// -------------------------------------------------------------
// ROOMS API with Automatic Multi-Tier Fallback
// -------------------------------------------------------------

export async function getRooms(): Promise<Room[]> {
  // 1. Try Backend API
  try {
    const res = await fetch(`${API_BASE}/rooms`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        setCachedRooms(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/rooms unreachable, using Google Sheets direct fallback');
  }

  // 2. Direct Google Sheets Fetch Fallback
  try {
    const sheetData = await fetchDirectSheetCSV('ROOMS');
    if (sheetData && sheetData.length > 0) {
      const parsedRooms: Room[] = sheetData.map((row: any, index: number) => {
        let pos = { x: 100, y: 100, width: 120, height: 80, color: '#2563eb' };
        try {
          if (row.posisi_siteplan) {
            pos = typeof row.posisi_siteplan === 'string' ? JSON.parse(row.posisi_siteplan) : row.posisi_siteplan;
          }
        } catch (e) {}

        return {
          id: row.id || `ROOM-${String(index + 1).padStart(3, '0')}`,
          kode_ruangan: row.kode_ruangan || `R-${index + 1}`,
          nama_ruangan: row.nama_ruangan || `Ruangan ${index + 1}`,
          jenis_ruangan: row.jenis_ruangan || 'Ruang Kelas',
          lantai: Number(row.lantai) || 1,
          posisi_siteplan: pos,
          deskripsi: row.deskripsi || '',
          foto: row.foto || '',
          status: row.status || 'Aktif',
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString()
        };
      });

      if (parsedRooms.length > 0) {
        setCachedRooms(parsedRooms);
        return parsedRooms;
      }
    }
  } catch (err) {
    console.warn('Direct Google Sheet fetch for ROOMS failed:', err);
  }

  // 3. Cached localStorage or Initial Dataset
  const cached = getCachedRooms();
  if (cached && cached.length > 0) {
    return cached;
  }

  return INITIAL_ROOMS;
}

export async function getRoomById(id: string): Promise<Room & { sarpras_list: Sarpras[] }> {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.warn(`Backend /api/rooms/${id} unreachable, using local lookup`);
  }

  const allRooms = await getRooms();
  const room = allRooms.find(r => r.id === id) || allRooms[0] || INITIAL_ROOMS[0];
  const allItems = await getAllSarpras(id);

  return {
    ...room,
    sarpras_list: allItems
  };
}

// -------------------------------------------------------------
// SARPRAS API with Automatic Multi-Tier Fallback
// -------------------------------------------------------------

export async function getAllSarpras(roomId?: string): Promise<Sarpras[]> {
  let list: Sarpras[] = [];

  // 1. Try Backend API
  try {
    const url = roomId ? `${API_BASE}/sarpras?room_id=${roomId}` : `${API_BASE}/sarpras`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        if (!roomId) setCachedSarpras(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/sarpras unreachable, using Google Sheets direct fallback');
  }

  // 2. Direct Google Sheets Fetch Fallback
  try {
    const sheetData = await fetchDirectSheetCSV('SARPRAS');
    if (sheetData && sheetData.length > 0) {
      const valid = sheetData.filter((row: any) => row.nama_barang && String(row.nama_barang).trim() !== '');
      list = valid.map((row: any, index: number) => ({
        id: row.id || `SRP-${String(index + 1).padStart(3, '0')}`,
        room_id: row.room_id || 'ROOM-001',
        nama_barang: row.nama_barang || `Barang ${index + 1}`,
        kategori: row.kategori || 'Fasilitas',
        merk: row.merk || '-',
        spesifikasi: row.spesifikasi || '-',
        jumlah: Number(row.jumlah) || 1,
        satuan: row.satuan || 'Unit',
        kondisi: row.kondisi || 'Baik',
        tahun_pengadaan: row.tahun_pengadaan || '2023',
        sumber_dana: row.sumber_dana || 'BOS',
        keterangan: row.keterangan || '',
        foto: row.foto || '',
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString()
      }));
      setCachedSarpras(list);
    }
  } catch (err) {
    console.warn('Direct Google Sheet fetch for SARPRAS failed:', err);
  }

  // 3. Cached localStorage Fallback (if any previously saved)
  if (list.length === 0) {
    const cached = getCachedSarpras();
    if (cached) {
      list = cached;
    }
  }

  if (roomId) {
    return list.filter(s => s.room_id === roomId);
  }

  return list;
}

// -------------------------------------------------------------
// STATS API
// -------------------------------------------------------------

export async function getStats(): Promise<StatsSummary> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend /api/stats unreachable, computing from active data');
  }

  const [rooms, sarpras] = await Promise.all([getRooms(), getAllSarpras()]);

  const totalItemsCount = sarpras.reduce((sum, item) => sum + item.jumlah, 0);
  const baikCount = sarpras.filter(s => s.kondisi === 'Baik').reduce((sum, i) => sum + i.jumlah, 0);
  const rusakRinganCount = sarpras.filter(s => s.kondisi === 'Rusak Ringan').reduce((sum, i) => sum + i.jumlah, 0);
  const rusakBeratCount = sarpras.filter(s => s.kondisi === 'Rusak Berat').reduce((sum, i) => sum + i.jumlah, 0);
  const tidakLayakCount = sarpras.filter(s => s.kondisi === 'Tidak Layak').reduce((sum, i) => sum + i.jumlah, 0);

  return {
    totalRooms: rooms.length,
    totalSarpras: sarpras.length,
    totalItemsCount,
    baikCount,
    rusakRinganCount,
    rusakBeratCount,
    tidakLayakCount,
    lastUpdated: new Date().toISOString(),
    isSyncedWithSheets: true
  };
}

// -------------------------------------------------------------
// MUTATIONS (ROOMS)
// -------------------------------------------------------------

export async function createRoom(room: Partial<Room>): Promise<Room> {
  const newRoom: Room = {
    id: room.id || `ROOM-${Date.now()}`,
    kode_ruangan: room.kode_ruangan || 'R-NEW',
    nama_ruangan: room.nama_ruangan || 'Ruangan Baru',
    jenis_ruangan: room.jenis_ruangan || 'Ruang Kelas',
    lantai: Number(room.lantai) || 1,
    posisi_siteplan: room.posisi_siteplan || { x: 200, y: 200, width: 120, height: 80, color: '#2563eb' },
    deskripsi: room.deskripsi || '',
    foto: room.foto || '',
    status: room.status || 'Aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  // Fallback local update & Apps Script
  const current = await getRooms();
  const updated = [...current, newRoom];
  setCachedRooms(updated);
  sendMutationToAppsScript('ROOMS', 'INSERT', newRoom);
  return newRoom;
}

export async function updateRoom(id: string, room: Partial<Room>): Promise<Room> {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  // Fallback local update & Apps Script
  const current = await getRooms();
  const idx = current.findIndex(r => r.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...room, updated_at: new Date().toISOString() };
    setCachedRooms(current);
    sendMutationToAppsScript('ROOMS', 'UPDATE', current[idx]);
    return current[idx];
  }

  return room as Room;
}

export async function deleteRoom(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
    if (res.ok) return;
  } catch (err) {}

  const current = await getRooms();
  setCachedRooms(current.filter(r => r.id !== id));
  sendMutationToAppsScript('ROOMS', 'DELETE', null, id);
}

export async function saveSiteplanPositions(positions: { id: string; posisi_siteplan: any }[]): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/siteplan/update-positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions })
    });
    if (res.ok) return;
  } catch (err) {}

  const current = await getRooms();
  positions.forEach(p => {
    const r = current.find(x => x.id === p.id);
    if (r) {
      r.posisi_siteplan = p.posisi_siteplan;
      r.updated_at = new Date().toISOString();
      sendMutationToAppsScript('ROOMS', 'UPDATE', r);
    }
  });
  setCachedRooms(current);
}

// -------------------------------------------------------------
// MUTATIONS (SARPRAS)
// -------------------------------------------------------------

export async function createSarpras(item: Partial<Sarpras>): Promise<Sarpras> {
  const newItem: Sarpras = {
    id: item.id || `SRP-${Date.now()}`,
    room_id: item.room_id || 'ROOM-001',
    nama_barang: item.nama_barang || 'Barang Baru',
    kategori: item.kategori || 'Fasilitas',
    merk: item.merk || '-',
    spesifikasi: item.spesifikasi || '-',
    jumlah: Number(item.jumlah) || 1,
    satuan: item.satuan || 'Unit',
    kondisi: item.kondisi || 'Baik',
    tahun_pengadaan: item.tahun_pengadaan || '2023',
    sumber_dana: item.sumber_dana || 'BOS',
    keterangan: item.keterangan || '',
    foto: item.foto || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE}/sarpras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  const current = await getAllSarpras();
  const updated = [...current, newItem];
  setCachedSarpras(updated);
  sendMutationToAppsScript('SARPRAS', 'INSERT', newItem);
  return newItem;
}

export async function updateSarpras(id: string, item: Partial<Sarpras>): Promise<Sarpras> {
  try {
    const res = await fetch(`${API_BASE}/sarpras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  const current = await getAllSarpras();
  const idx = current.findIndex(s => s.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...item, updated_at: new Date().toISOString() };
    setCachedSarpras(current);
    sendMutationToAppsScript('SARPRAS', 'UPDATE', current[idx]);
    return current[idx];
  }

  return item as Sarpras;
}

export async function deleteSarpras(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/sarpras/${id}`, { method: 'DELETE' });
    if (res.ok) return;
  } catch (err) {}

  const current = await getAllSarpras();
  setCachedSarpras(current.filter(s => s.id !== id));
  sendMutationToAppsScript('SARPRAS', 'DELETE', null, id);
}

export async function bulkImportSarpras(
  items: Partial<Sarpras>[],
  mode: 'append' | 'merge' = 'append'
): Promise<{ success: boolean; message: string; insertedCount: number; updatedCount: number; totalSarpras: number }> {
  try {
    const res = await fetch(`${API_BASE}/sarpras/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, mode })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // Fallback client-side import
  const current = await getAllSarpras();
  const rooms = await getRooms();
  let inserted = 0;
  let updated = 0;

  items.forEach((item, idx) => {
    let targetRoomId = item.room_id;
    if (!targetRoomId || !rooms.some(r => r.id === targetRoomId)) {
      const anyItem = item as any;
      const found = rooms.find(r => 
        r.id.toLowerCase() === String(anyItem.room_id || '').toLowerCase() ||
        r.kode_ruangan.toLowerCase() === String(anyItem.kode_ruangan || anyItem.room_id || '').toLowerCase() ||
        r.nama_ruangan.toLowerCase() === String(anyItem.nama_ruangan || anyItem.room_id || '').toLowerCase()
      );
      targetRoomId = found ? found.id : (rooms[0]?.id || 'ROOM-001');
    }

    const existIdx = current.findIndex(s =>
      (item.id && s.id === item.id) ||
      (mode === 'merge' && s.room_id === targetRoomId && s.nama_barang.toLowerCase().trim() === String(item.nama_barang || '').toLowerCase().trim())
    );

    if (existIdx !== -1 && mode === 'merge') {
      current[existIdx] = {
        ...current[existIdx],
        ...item,
        room_id: targetRoomId,
        jumlah: Number(item.jumlah) || current[existIdx].jumlah,
        updated_at: new Date().toISOString()
      };
      updated++;
      sendMutationToAppsScript('SARPRAS', 'UPDATE', current[existIdx]);
    } else {
      const newItem: Sarpras = {
        id: item.id || `SRP-IMP-${Date.now()}-${idx}`,
        room_id: targetRoomId,
        nama_barang: String(item.nama_barang || 'Barang Import').trim(),
        kategori: String(item.kategori || 'Fasilitas').trim(),
        merk: String(item.merk || '-').trim(),
        spesifikasi: String(item.spesifikasi || '-').trim(),
        jumlah: Math.max(1, Number(item.jumlah) || 1),
        satuan: String(item.satuan || 'Unit').trim(),
        kondisi: ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Tidak Layak'].includes(item.kondisi as any) ? (item.kondisi as any) : 'Baik',
        tahun_pengadaan: String(item.tahun_pengadaan || new Date().getFullYear()).trim(),
        sumber_dana: String(item.sumber_dana || 'BOS').trim(),
        keterangan: String(item.keterangan || '').trim(),
        foto: item.foto || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      current.push(newItem);
      inserted++;
      sendMutationToAppsScript('SARPRAS', 'INSERT', newItem);
    }
  });

  setCachedSarpras(current);

  return {
    success: true,
    message: `Berhasil mengimport ${inserted + updated} barang sarpras (${inserted} baru, ${updated} diperbarui).`,
    insertedCount: inserted,
    updatedCount: updated,
    totalSarpras: current.length
  };
}

// -------------------------------------------------------------
// GOOGLE SHEETS SYNC
// -------------------------------------------------------------

export async function syncSheetsData(): Promise<{ message: string; lastUpdated: string }> {
  // 1. Try backend sync
  try {
    const res = await fetch(`${API_BASE}/sheets/sync`);
    if (res.ok) {
      const json = await res.json();
      return {
        message: json.message || 'Sinkronisasi berhasil',
        lastUpdated: json.lastUpdated || new Date().toISOString()
      };
    }
  } catch (err) {}

  // 2. Client-side direct Google Sheets sync
  try {
    const [roomsData, sarprasData, adminsData] = await Promise.all([
      fetchDirectSheetCSV('ROOMS'),
      fetchDirectSheetCSV('SARPRAS'),
      fetchDirectSheetCSV('ADMINS')
    ]);

    if (roomsData.length > 0) {
      const parsedRooms: Room[] = roomsData.map((row: any, index: number) => {
        let pos = { x: 100, y: 100, width: 120, height: 80, color: '#2563eb' };
        try {
          if (row.posisi_siteplan) {
            pos = typeof row.posisi_siteplan === 'string' ? JSON.parse(row.posisi_siteplan) : row.posisi_siteplan;
          }
        } catch (e) {}

        return {
          id: row.id || `ROOM-${String(index + 1).padStart(3, '0')}`,
          kode_ruangan: row.kode_ruangan || `R-${index + 1}`,
          nama_ruangan: row.nama_ruangan || `Ruangan ${index + 1}`,
          jenis_ruangan: row.jenis_ruangan || 'Ruang Kelas',
          lantai: Number(row.lantai) || 1,
          posisi_siteplan: pos,
          deskripsi: row.deskripsi || '',
          foto: row.foto || '',
          status: row.status || 'Aktif',
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString()
        };
      });
      setCachedRooms(parsedRooms);
    }

    const validSarprasRows = (sarprasData || []).filter((row: any) => row.nama_barang && String(row.nama_barang).trim() !== '');
    const parsedSarpras: Sarpras[] = validSarprasRows.map((row: any, index: number) => ({
      id: row.id || `SRP-${String(index + 1).padStart(3, '0')}`,
      room_id: row.room_id || 'ROOM-001',
      nama_barang: row.nama_barang || `Barang ${index + 1}`,
      kategori: row.kategori || 'Fasilitas',
      merk: row.merk || '-',
      spesifikasi: row.spesifikasi || '-',
      jumlah: Number(row.jumlah) || 1,
      satuan: row.satuan || 'Unit',
      kondisi: row.kondisi || 'Baik',
      tahun_pengadaan: row.tahun_pengadaan || '2023',
      sumber_dana: row.sumber_dana || 'BOS',
      keterangan: row.keterangan || '',
      foto: row.foto || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString()
    }));
    setCachedSarpras(parsedSarpras);

    if (adminsData.length > 0) {
      const parsedAdmins: AdminUser[] = adminsData.map((row: any, index: number) => ({
        id: row.id || `ADM-${String(index + 1).padStart(3, '0')}`,
        nama: row.nama || `Admin ${index + 1}`,
        username: row.username || `admin${index + 1}`,
        email: row.email || `admin${index + 1}@smkn1batumandi.sch.id`,
        password_hash: row.password_hash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        role: row.role || 'Petugas Sarpras',
        status: row.status || 'Aktif',
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString()
      }));
      setCachedAdmins(parsedAdmins);
    }

    return {
      message: 'Sinkronisasi langsung dengan Google Spreadsheet berhasil!',
      lastUpdated: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      message: 'Sinkronisasi data selesai (data lokal diperbarui)',
      lastUpdated: new Date().toISOString()
    };
  }
}

// -------------------------------------------------------------
// ADMINS API
// -------------------------------------------------------------

export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const res = await fetch(`${API_BASE}/admins`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        setCachedAdmins(json.data);
        return json.data;
      }
    }
  } catch (err) {}

  // Google Sheet Fallback for Admins
  try {
    const sheetData = await fetchDirectSheetCSV('ADMINS');
    if (sheetData && sheetData.length > 0) {
      const parsed: AdminUser[] = sheetData.map((row: any, index: number) => ({
        id: row.id || `ADM-${String(index + 1).padStart(3, '0')}`,
        nama: row.nama || `Admin ${index + 1}`,
        username: row.username || `admin${index + 1}`,
        email: row.email || `admin${index + 1}@smkn1batumandi.sch.id`,
        password_hash: row.password_hash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        role: row.role || 'Petugas Sarpras',
        status: row.status || 'Aktif',
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString()
      }));
      setCachedAdmins(parsed);
      return parsed;
    }
  } catch (err) {}

  const cached = getCachedAdmins();
  if (cached && cached.length > 0) return cached;

  return INITIAL_ADMINS;
}

export async function createAdmin(admin: Partial<AdminUser>): Promise<AdminUser> {
  const newAdmin: AdminUser = {
    id: admin.id || `ADM-${Date.now()}`,
    nama: admin.nama || 'User Admin',
    username: admin.username || `user_${Date.now()}`,
    email: admin.email || `user_${Date.now()}@smkn1batumandi.sch.id`,
    password_hash: admin.password_hash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    role: admin.role || 'Petugas Sarpras',
    status: admin.status || 'Aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdmin)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  const current = await getAdmins();
  const updated = [...current, newAdmin];
  setCachedAdmins(updated);
  sendMutationToAppsScript('ADMINS', 'INSERT', newAdmin);
  return newAdmin;
}

export async function updateAdmin(id: string, admin: Partial<AdminUser>): Promise<AdminUser> {
  try {
    const res = await fetch(`${API_BASE}/admins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  const current = await getAdmins();
  const idx = current.findIndex(a => a.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...admin, updated_at: new Date().toISOString() };
    setCachedAdmins(current);
    sendMutationToAppsScript('ADMINS', 'UPDATE', current[idx]);
    return current[idx];
  }

  return admin as AdminUser;
}

export async function deleteAdmin(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admins/${id}`, { method: 'DELETE' });
    if (res.ok) return;
  } catch (err) {}

  const current = await getAdmins();
  setCachedAdmins(current.filter(a => a.id !== id));
  sendMutationToAppsScript('ADMINS', 'DELETE', null, id);
}

export async function pushAllToSheets(): Promise<{ message: string; adminsCount: number }> {
  try {
    const res = await fetch(`${API_BASE}/sheets/push-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const [rooms, sarpras, admins] = await Promise.all([getRooms(), getAllSarpras(), getAdmins()]);
  admins.forEach(a => sendMutationToAppsScript('ADMINS', 'INSERT', a));
  rooms.forEach(r => sendMutationToAppsScript('ROOMS', 'INSERT', r));
  sarpras.forEach(s => sendMutationToAppsScript('SARPRAS', 'INSERT', s));

  return {
    message: 'Semua data ruangan, sarpras, dan admin berhasil dikirim ke Google Apps Script',
    adminsCount: admins.length
  };
}
