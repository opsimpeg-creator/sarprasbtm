import { Room, Sarpras, StatsSummary, AdminUser, AppSettings, DEFAULT_APP_SETTINGS } from '../types';

const API_BASE = '/api';

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Gagal mengambil pengaturan sistem');
    const json = await res.json();
    return json.data || DEFAULT_APP_SETTINGS;
  } catch (err) {
    console.error('getAppSettings error:', err);
    // Fallback to local storage if API call fails
    const saved = localStorage.getItem('smk_app_settings');
    if (saved) {
      try { return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) }; } catch (e) {}
    }
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  // Update localStorage immediately as local cache
  localStorage.setItem('smk_app_settings', JSON.stringify(settings));
  window.dispatchEvent(new Event('appSettingsUpdated'));

  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Gagal menyimpan pengaturan sistem ke server');
  const json = await res.json();
  return json.data || settings;
}

export async function getRooms(): Promise<Room[]> {
  try {
    const res = await fetch(`${API_BASE}/rooms`);
    if (!res.ok) throw new Error('Gagal mengambil data ruangan');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('getRooms API error:', err);
    throw err;
  }
}

export async function getRoomById(id: string): Promise<Room & { sarpras_list: Sarpras[] }> {
  try {
    const res = await fetch(`${API_BASE}/rooms/${id}`);
    if (!res.ok) throw new Error('Gagal mengambil detail ruangan');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error(`getRoomById error for ${id}:`, err);
    throw err;
  }
}

export async function getAllSarpras(roomId?: string): Promise<Sarpras[]> {
  try {
    const url = roomId ? `${API_BASE}/sarpras?room_id=${roomId}` : `${API_BASE}/sarpras`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data sarana prasarana');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('getAllSarpras API error:', err);
    throw err;
  }
}

export async function getStats(): Promise<StatsSummary> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Gagal mengambil statistik');
    return await res.json();
  } catch (err) {
    console.error('getStats error:', err);
    throw {
      totalRooms: 0,
      totalSarpras: 0,
      totalItemsCount: 0,
      baikCount: 0,
      rusakRinganCount: 0,
      rusakBeratCount: 0,
      tidakLayakCount: 0,
      lastUpdated: new Date().toISOString(),
      isSyncedWithSheets: false
    };
  }
}

export async function createRoom(room: Partial<Room>): Promise<Room> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room)
  });
  if (!res.ok) throw new Error('Gagal membuat ruangan baru');
  const json = await res.json();
  return json.data;
}

export async function updateRoom(id: string, room: Partial<Room>): Promise<Room> {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room)
  });
  if (!res.ok) throw new Error('Gagal memperbarui ruangan');
  const json = await res.json();
  return json.data;
}

export async function deleteRoom(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Gagal menghapus ruangan');
}

export async function saveSiteplanPositions(positions: { id: string; posisi_siteplan: any }[]): Promise<void> {
  const res = await fetch(`${API_BASE}/siteplan/update-positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positions })
  });
  if (!res.ok) throw new Error('Gagal menyimpan posisi siteplan');
}

export async function createSarpras(item: Partial<Sarpras>): Promise<Sarpras> {
  const res = await fetch(`${API_BASE}/sarpras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Gagal menambahkan barang sarpras');
  const json = await res.json();
  return json.data;
}

export async function updateSarpras(id: string, item: Partial<Sarpras>): Promise<Sarpras> {
  const res = await fetch(`${API_BASE}/sarpras/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Gagal memperbarui barang sarpras');
  const json = await res.json();
  return json.data;
}

export async function deleteSarpras(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sarpras/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Gagal menghapus barang sarpras');
}

export async function syncSheetsData(): Promise<{ message: string; lastUpdated: string }> {
  const res = await fetch(`${API_BASE}/sheets/sync`);
  if (!res.ok) throw new Error('Gagal sinkronisasi dengan Google Sheets');
  return await res.json();
}

export async function getAdmins(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE}/admins`);
  if (!res.ok) throw new Error('Gagal mengambil data admin');
  const json = await res.json();
  return json.data || [];
}

export async function createAdmin(admin: Partial<AdminUser>): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin)
  });
  if (!res.ok) throw new Error('Gagal menambahkan admin baru');
  const json = await res.json();
  return json.data;
}

export async function updateAdmin(id: string, admin: Partial<AdminUser>): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin)
  });
  if (!res.ok) throw new Error('Gagal memperbarui data admin');
  const json = await res.json();
  return json.data;
}

export async function deleteAdmin(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admins/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Gagal menghapus data admin');
}

export async function pushAllToSheets(): Promise<{ message: string; adminsCount: number }> {
  const res = await fetch(`${API_BASE}/sheets/push-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Gagal mengirim data ke Google Sheets');
  return await res.json();
}
