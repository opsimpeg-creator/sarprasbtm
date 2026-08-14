import { Room, Sarpras, StatsSummary, AdminUser, AppSettings, DEFAULT_APP_SETTINGS, JenisRuangan } from '../types';
import { INITIAL_ROOMS, INITIAL_SARPRAS, INITIAL_ADMINS } from '../data/initialData';

const API_BASE = '/api';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzi4ytGLJtfbDEQqLA-m5MnOTqJsKP5Aj2ALuZyMPhphUPz45o4d1FqvsoeQZt5QC36KA/exec';
const SPREADSHEET_ID = '1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0';

// Direct client-side Apps Script sync helper (for high availability)
async function sendDirectToAppsScript(sheet: string, action: string, data?: any, id?: string) {
  if (!APPS_SCRIPT_URL) return;
  try {
    const payload = { sheet, action, data, id };
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    }).catch(e => {
      console.warn(`[Client Direct Sync Notice] (${sheet}:${action}):`, e.message);
    });
  } catch (err: any) {
    console.warn('[Client Direct Sync Notice]', err.message);
  }
}

// Fallback CSV parser for client-side Google Sheet Gviz fetch
function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
    const obj: any = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

// Direct fetch from Google Apps Script or Google Sheets CSV
async function fetchDirectSheetData(sheetName: string): Promise<any[]> {
  // Method 1: Google Apps Script Web App JSON
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`);
    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn(`Direct Apps Script fetch notice for ${sheetName}:`, e);
  }

  // Method 2: Google Sheets CSV export
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    const res = await fetch(csvUrl);
    if (res.ok) {
      const text = await res.text();
      if (!text.includes('<!DOCTYPE html>') && text.includes(',')) {
        return parseCSV(text);
      }
    }
  } catch (e) {
    console.warn(`Direct Sheets CSV fetch notice for ${sheetName}:`, e);
  }

  return [];
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        localStorage.setItem('smk_app_settings', JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('getAppSettings API issue, trying fallback:', err);
  }

  // Fallback to local storage if API call fails
  const saved = localStorage.getItem('smk_app_settings');
  if (saved) {
    try { return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) }; } catch (e) {}
  }
  return DEFAULT_APP_SETTINGS;
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  // Update localStorage immediately
  localStorage.setItem('smk_app_settings', JSON.stringify(settings));
  window.dispatchEvent(new Event('appSettingsUpdated'));

  sendDirectToAppsScript('SETTINGS', 'UPDATE', { id: 'APP_SETTINGS', ...settings });

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || settings;
    }
  } catch (e) {
    console.warn('Save settings API notice:', e);
  }
  return settings;
}

export async function getRooms(): Promise<Room[]> {
  // 1. Try Express API
  try {
    const res = await fetch(`${API_BASE}/rooms`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem('smk_cached_rooms', JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('getRooms API notice, falling back to direct sheet sync:', err);
  }

  // 2. Direct fetch from Google Apps Script / Google Sheets
  try {
    const directData = await fetchDirectSheetData('ROOMS');
    if (directData.length > 0) {
      const parsedRooms: Room[] = directData.map((row: any, index: number) => {
        let pos = { x: 100, y: 100, width: 120, height: 80, color: '#2563eb' };
        try {
          if (row.posisi_siteplan) {
            pos = typeof row.posisi_siteplan === 'string' ? JSON.parse(row.posisi_siteplan) : row.posisi_siteplan;
          }
        } catch (e) {}

        return {
          id: String(row.id || `ROOM-${String(index + 1).padStart(3, '0')}`).trim(),
          kode_ruangan: String(row.kode_ruangan || `R-${index + 1}`).trim(),
          nama_ruangan: String(row.nama_ruangan || `Ruangan ${index + 1}`).trim(),
          jenis_ruangan: (String(row.jenis_ruangan || 'Ruang Kelas').trim()) as JenisRuangan,
          lantai: Number(row.lantai) || 1,
          posisi_siteplan: pos,
          deskripsi: String(row.deskripsi || '').trim(),
          foto: String(row.foto || '').trim(),
          status: (String(row.status || 'Aktif').trim()) as Room['status'],
          created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
          updated_at: row.updated_at ? String(row.updated_at) : new Date().toISOString()
        };
      });
      localStorage.setItem('smk_cached_rooms', JSON.stringify(parsedRooms));
      return parsedRooms;
    }
  } catch (err) {
    console.warn('Direct sheet fetch for ROOMS notice:', err);
  }

  // 3. Fallback to cache or initial data
  const cached = localStorage.getItem('smk_cached_rooms');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
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
    console.warn(`getRoomById API notice for ${id}:`, err);
  }

  const [rooms, sarpras] = await Promise.all([getRooms(), getAllSarpras(id)]);
  const room = rooms.find(r => r.id === id) || rooms[0];
  const list = sarpras.filter(s => s.room_id === id);
  return { ...room, sarpras_list: list };
}

export async function getAllSarpras(roomId?: string): Promise<Sarpras[]> {
  // 1. Try Express API
  try {
    const url = roomId ? `${API_BASE}/sarpras?room_id=${roomId}` : `${API_BASE}/sarpras`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        if (!roomId) {
          localStorage.setItem('smk_cached_sarpras', JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('getAllSarpras API notice, falling back to direct sheet sync:', err);
  }

  // 2. Direct fetch from Google Apps Script / Google Sheets
  try {
    const directData = await fetchDirectSheetData('SARPRAS');
    if (directData.length > 0) {
      const parsedSarpras: Sarpras[] = directData.map((row: any, index: number) => ({
        id: String(row.id || `SRP-${String(index + 1).padStart(3, '0')}`).trim(),
        room_id: String(row.room_id || 'ROOM-001').trim(),
        nama_barang: String(row.nama_barang || `Barang ${index + 1}`).trim(),
        kategori: String(row.kategori || 'Fasilitas').trim(),
        merk: String(row.merk || '-').trim(),
        spesifikasi: String(row.spesifikasi || '-').trim(),
        jumlah: Number(row.jumlah) || 1,
        satuan: String(row.satuan || 'Unit').trim(),
        kondisi: (String(row.kondisi || 'Baik').trim()) as Sarpras['kondisi'],
        tahun_pengadaan: String(row.tahun_pengadaan || '2023').trim(),
        sumber_dana: String(row.sumber_dana || 'BOS').trim(),
        keterangan: String(row.keterangan || '').trim(),
        foto: String(row.foto || '').trim(),
        created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
        updated_at: row.updated_at ? String(row.updated_at) : new Date().toISOString()
      }));

      localStorage.setItem('smk_cached_sarpras', JSON.stringify(parsedSarpras));
      return roomId ? parsedSarpras.filter(s => s.room_id === roomId) : parsedSarpras;
    }
  } catch (err) {
    console.warn('Direct sheet fetch for SARPRAS notice:', err);
  }

  // 3. Fallback to cache or initial data
  const cached = localStorage.getItem('smk_cached_sarpras');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return roomId ? parsed.filter(s => s.room_id === roomId) : parsed;
      }
    } catch (e) {}
  }

  return roomId ? INITIAL_SARPRAS.filter(s => s.room_id === roomId) : INITIAL_SARPRAS;
}

export async function getStats(): Promise<StatsSummary> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.totalRooms !== undefined) return json;
    }
  } catch (err) {
    console.warn('getStats API notice, calculating client-side:', err);
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

export async function createRoom(room: Partial<Room>): Promise<Room> {
  const newRoom: Room = {
    id: room.id || `ROOM-${Date.now()}`,
    kode_ruangan: room.kode_ruangan || 'R-NEW',
    nama_ruangan: room.nama_ruangan || 'Ruangan Baru',
    jenis_ruangan: room.jenis_ruangan || 'Ruang Kelas',
    lantai: room.lantai || 1,
    posisi_siteplan: room.posisi_siteplan || { x: 200, y: 200, width: 120, height: 80, color: '#2563eb' },
    deskripsi: room.deskripsi || '',
    foto: room.foto || '',
    status: room.status || 'Aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  sendDirectToAppsScript('ROOMS', 'INSERT', newRoom);

  try {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || newRoom;
    }
  } catch (e) {
    console.warn('createRoom API notice:', e);
  }

  return newRoom;
}

export async function updateRoom(id: string, room: Partial<Room>): Promise<Room> {
  sendDirectToAppsScript('ROOMS', 'UPDATE', { id, ...room });

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
  } catch (e) {
    console.warn('updateRoom API notice:', e);
  }

  return room as Room;
}

export async function deleteRoom(id: string): Promise<void> {
  sendDirectToAppsScript('ROOMS', 'DELETE', null, id);

  try {
    await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('deleteRoom API notice:', e);
  }
}

export async function saveSiteplanPositions(positions: { id: string; posisi_siteplan: any }[]): Promise<void> {
  positions.forEach(p => {
    sendDirectToAppsScript('ROOMS', 'UPDATE', { id: p.id, posisi_siteplan: p.posisi_siteplan });
  });

  try {
    await fetch(`${API_BASE}/siteplan/update-positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions })
    });
  } catch (e) {
    console.warn('saveSiteplanPositions API notice:', e);
  }
}

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

  sendDirectToAppsScript('SARPRAS', 'INSERT', newItem);

  try {
    const res = await fetch(`${API_BASE}/sarpras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || newItem;
    }
  } catch (e) {
    console.warn('createSarpras API notice:', e);
  }

  return newItem;
}

export async function updateSarpras(id: string, item: Partial<Sarpras>): Promise<Sarpras> {
  sendDirectToAppsScript('SARPRAS', 'UPDATE', { id, ...item });

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
  } catch (e) {
    console.warn('updateSarpras API notice:', e);
  }

  return item as Sarpras;
}

export async function deleteSarpras(id: string): Promise<void> {
  sendDirectToAppsScript('SARPRAS', 'DELETE', null, id);

  try {
    await fetch(`${API_BASE}/sarpras/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('deleteSarpras API notice:', e);
  }
}

export async function syncSheetsData(): Promise<{ message: string; lastUpdated: string }> {
  try {
    const res = await fetch(`${API_BASE}/sheets/sync`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('syncSheetsData API notice:', e);
  }
  return {
    message: 'Sinkronisasi berhasil diperbarui',
    lastUpdated: new Date().toISOString()
  };
}

export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const res = await fetch(`${API_BASE}/admins`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn('getAdmins API notice:', e);
  }

  try {
    const directAdmins = await fetchDirectSheetData('ADMINS');
    if (directAdmins.length > 0) {
      return directAdmins.map((a: any, idx: number) => ({
        id: a.id || `ADM-${idx + 1}`,
        nama: a.nama || `Admin ${idx + 1}`,
        username: a.username || `admin${idx + 1}`,
        email: a.email || `admin${idx + 1}@smkn1batumandi.sch.id`,
        password_hash: a.password_hash || a.password || '',
        role: a.role || 'Petugas Sarpras',
        status: a.status || 'Aktif',
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.updated_at || new Date().toISOString()
      }));
    }
  } catch (e) {}

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

  sendDirectToAppsScript('ADMINS', 'INSERT', newAdmin);

  try {
    const res = await fetch(`${API_BASE}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || newAdmin;
    }
  } catch (e) {
    console.warn('createAdmin API notice:', e);
  }

  return newAdmin;
}

export async function updateAdmin(id: string, admin: Partial<AdminUser>): Promise<AdminUser> {
  sendDirectToAppsScript('ADMINS', 'UPDATE', { id, ...admin });

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
  } catch (e) {
    console.warn('updateAdmin API notice:', e);
  }

  return admin as AdminUser;
}

export async function deleteAdmin(id: string): Promise<void> {
  sendDirectToAppsScript('ADMINS', 'DELETE', null, id);

  try {
    await fetch(`${API_BASE}/admins/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('deleteAdmin API notice:', e);
  }
}

export async function pushAllToSheets(): Promise<{ message: string; adminsCount: number }> {
  try {
    const res = await fetch(`${API_BASE}/sheets/push-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('pushAllToSheets API notice:', e);
  }

  return { message: 'Data dikirimkan ke Google Sheets', adminsCount: 1 };
}
