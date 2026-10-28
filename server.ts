import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import Papa from 'papaparse';
import { Room, Sarpras, AdminUser, StatsSummary } from './src/types.js';
import { INITIAL_ROOMS, INITIAL_SARPRAS, INITIAL_ADMINS } from './src/data/initialData.js';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0';
const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzi4ytGLJtfbDEQqLA-m5MnOTqJsKP5Aj2ALuZyMPhphUPz45o4d1FqvsoeQZt5QC36KA/exec';
const DATA_FILE = path.join(process.cwd(), 'data_store.json');

// Send mutations to Google Apps Script Web App for auto Google Sheets persistence
async function sendToAppsScript(sheet: string, action: string, data?: any, id?: string) {
  if (!APPS_SCRIPT_URL) return;
  try {
    const payload = { sheet, action, data, id };
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).then(async res => {
      const txt = await res.text();
      if (txt.includes('Script function not found') || txt.includes('<!DOCTYPE html>') || txt.includes('Error')) {
        console.warn(`[Google Apps Script Sync] Notice (${sheet}:${action}): Web App requires deploying Code.gs with doPost function. Local persistent storage updated successfully.`);
      } else {
        console.log(`[Google Apps Script Sync] Success (${sheet}:${action}):`, txt.slice(0, 100));
      }
    }).catch(e => {
      console.warn(`[Google Apps Script Sync] Warning (${sheet}:${action}):`, e.message);
    });
  } catch (err: any) {
    console.warn('[Google Apps Script Sync] Exception:', err.message);
  }
}

// In-memory / persistent data store
interface Store {
  rooms: Room[];
  sarpras: Sarpras[];
  admins: AdminUser[];
  lastUpdated: string;
  isSyncedWithSheets: boolean;
}

function loadStore(): Store {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.rooms && parsed.sarpras) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading data_store.json, using initial dataset:', err);
  }

  const initialStore: Store = {
    rooms: INITIAL_ROOMS,
    sarpras: INITIAL_SARPRAS,
    admins: INITIAL_ADMINS,
    lastUpdated: new Date().toISOString(),
    isSyncedWithSheets: false
  };

  saveStore(initialStore);
  return initialStore;
}

function saveStore(store: Store) {
  try {
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save data store:', err);
  }
}

let store = loadStore();

// Attempt background sync with public Google Sheet if available
async function fetchSheetCSV(sheetName: string): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return parsed.data || [];
  } catch (e) {
    console.warn(`Could not fetch sheet ${sheetName}:`, e);
    return [];
  }
}

async function syncWithGoogleSheets() {
  try {
    const roomsData = await fetchSheetCSV('ROOMS');
    const sarprasData = await fetchSheetCSV('SARPRAS');
    const adminsData = await fetchSheetCSV('ADMINS');

    let updated = false;

    if (roomsData.length > 0) {
      const syncedRooms: Room[] = roomsData.map((row: any, index: number) => {
        let pos = { x: 100, y: 100, width: 120, height: 80, color: '#2563eb' };
        try {
          if (row.posisi_siteplan) {
            pos = typeof row.posisi_siteplan === 'string' ? JSON.parse(row.posisi_siteplan) : row.posisi_siteplan;
          }
        } catch (e) {
          // fallback
        }

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
      if (syncedRooms.length > 0) {
        store.rooms = syncedRooms;
        updated = true;
      }
    }

    if (sarprasData.length > 0) {
      const syncedSarpras: Sarpras[] = sarprasData.map((row: any, index: number) => ({
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
      if (syncedSarpras.length > 0) {
        store.sarpras = syncedSarpras;
        updated = true;
      }
    }

    if (adminsData.length > 0) {
      const syncedAdmins: AdminUser[] = adminsData.map((row: any, index: number) => ({
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
      if (syncedAdmins.length > 0) {
        store.admins = syncedAdmins;
        updated = true;
      }
    }

    if (updated) {
      store.isSyncedWithSheets = true;
      saveStore(store);
      console.log('Successfully synced data from Google Sheets ID:', SPREADSHEET_ID);
    }
  } catch (err) {
    console.warn('Google Sheets sync skipped, using persistent local store.');
  }
}

// Initial async sync
syncWithGoogleSheets();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES FIRST ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      spreadsheetId: SPREADSHEET_ID,
      roomsCount: store.rooms.length,
      sarprasCount: store.sarpras.length,
      lastUpdated: store.lastUpdated
    });
  });

  // Get Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const totalItemsCount = store.sarpras.reduce((sum, item) => sum + item.jumlah, 0);
    const baikCount = store.sarpras.filter(s => s.kondisi === 'Baik').reduce((sum, i) => sum + i.jumlah, 0);
    const rusakRinganCount = store.sarpras.filter(s => s.kondisi === 'Rusak Ringan').reduce((sum, i) => sum + i.jumlah, 0);
    const rusakBeratCount = store.sarpras.filter(s => s.kondisi === 'Rusak Berat').reduce((sum, i) => sum + i.jumlah, 0);
    const tidakLayakCount = store.sarpras.filter(s => s.kondisi === 'Tidak Layak').reduce((sum, i) => sum + i.jumlah, 0);

    const stats: StatsSummary = {
      totalRooms: store.rooms.length,
      totalSarpras: store.sarpras.length,
      totalItemsCount,
      baikCount,
      rusakRinganCount,
      rusakBeratCount,
      tidakLayakCount,
      lastUpdated: store.lastUpdated,
      isSyncedWithSheets: store.isSyncedWithSheets
    };

    res.json(stats);
  });

  // Get All Rooms
  app.get('/api/rooms', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: store.rooms,
      lastUpdated: store.lastUpdated,
      spreadsheetId: SPREADSHEET_ID
    });
  });

  // Get Room by ID
  app.get('/api/rooms/:id', (req: Request, res: Response) => {
    const room = store.rooms.find(r => r.id === req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan' });
    }
    const sarpras = store.sarpras.filter(s => s.room_id === room.id);
    res.json({
      success: true,
      data: {
        ...room,
        sarpras_list: sarpras
      }
    });
  });

  // Create Room
  app.post('/api/rooms', (req: Request, res: Response) => {
    const newRoom: Room = {
      id: req.body.id || `ROOM-${String(store.rooms.length + 1).padStart(3, '0')}`,
      kode_ruangan: req.body.kode_ruangan || `R-${store.rooms.length + 1}`,
      nama_ruangan: req.body.nama_ruangan || 'Ruangan Baru',
      jenis_ruangan: req.body.jenis_ruangan || 'Ruang Kelas',
      lantai: Number(req.body.lantai) || 1,
      posisi_siteplan: req.body.posisi_siteplan || { x: 200, y: 200, width: 120, height: 80, color: '#2563eb' },
      deskripsi: req.body.deskripsi || '',
      foto: req.body.foto || '',
      status: req.body.status || 'Aktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.rooms.push(newRoom);
    saveStore(store);
    sendToAppsScript('ROOMS', 'INSERT', newRoom);

    res.status(201).json({ success: true, data: newRoom, message: 'Ruangan berhasil ditambahkan' });
  });

  // Update Room
  app.put('/api/rooms/:id', (req: Request, res: Response) => {
    const index = store.rooms.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan' });
    }

    store.rooms[index] = {
      ...store.rooms[index],
      ...req.body,
      updated_at: new Date().toISOString()
    };

    saveStore(store);
    sendToAppsScript('ROOMS', 'UPDATE', store.rooms[index]);
    res.json({ success: true, data: store.rooms[index], message: 'Ruangan berhasil diperbarui' });
  });

  // Delete Room
  app.delete('/api/rooms/:id', (req: Request, res: Response) => {
    const roomId = req.params.id;
    store.rooms = store.rooms.filter(r => r.id !== roomId);
    // Also remove or unlink sarpras for this room
    store.sarpras = store.sarpras.filter(s => s.room_id !== roomId);
    saveStore(store);
    sendToAppsScript('ROOMS', 'DELETE', null, roomId);
    res.json({ success: true, message: 'Ruangan dan sarpras terkait berhasil dihapus' });
  });

  // Bulk update room positions for Siteplan Editor
  app.post('/api/siteplan/update-positions', (req: Request, res: Response) => {
    const { positions } = req.body; // Array of { id, posisi_siteplan }
    if (Array.isArray(positions)) {
      positions.forEach(p => {
        const room = store.rooms.find(r => r.id === p.id);
        if (room && p.posisi_siteplan) {
          room.posisi_siteplan = p.posisi_siteplan;
          room.updated_at = new Date().toISOString();
          sendToAppsScript('ROOMS', 'UPDATE', room);
        }
      });
      saveStore(store);
    }
    res.json({ success: true, message: 'Posisi siteplan berhasil disimpan', data: store.rooms });
  });

  // Get All Sarpras
  app.get('/api/sarpras', (req: Request, res: Response) => {
    const roomId = req.query.room_id as string;
    let list = store.sarpras;
    if (roomId) {
      list = list.filter(s => s.room_id === roomId);
    }
    res.json({ success: true, data: list });
  });

  // Get Sarpras Item by ID
  app.get('/api/sarpras/:id', (req: Request, res: Response) => {
    const item = store.sarpras.find(s => s.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Barang sarpras tidak ditemukan' });
    }
    res.json({ success: true, data: item });
  });

  // Create Sarpras
  app.post('/api/sarpras', (req: Request, res: Response) => {
    const newItem: Sarpras = {
      id: req.body.id || `SRP-${String(store.sarpras.length + 1).padStart(3, '0')}`,
      room_id: req.body.room_id || store.rooms[0]?.id || 'ROOM-001',
      nama_barang: req.body.nama_barang || 'Barang Baru',
      kategori: req.body.kategori || 'Fasilitas',
      merk: req.body.merk || '-',
      spesifikasi: req.body.spesifikasi || '-',
      jumlah: Number(req.body.jumlah) || 1,
      satuan: req.body.satuan || 'Unit',
      kondisi: req.body.kondisi || 'Baik',
      tahun_pengadaan: req.body.tahun_pengadaan || '2023',
      sumber_dana: req.body.sumber_dana || 'BOS',
      keterangan: req.body.keterangan || '',
      foto: req.body.foto || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.sarpras.push(newItem);
    saveStore(store);
    sendToAppsScript('SARPRAS', 'INSERT', newItem);
    res.status(201).json({ success: true, data: newItem, message: 'Barang sarpras berhasil ditambahkan' });
  });

  // Update Sarpras
  app.put('/api/sarpras/:id', (req: Request, res: Response) => {
    const index = store.sarpras.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Barang sarpras tidak ditemukan' });
    }

    store.sarpras[index] = {
      ...store.sarpras[index],
      ...req.body,
      updated_at: new Date().toISOString()
    };

    saveStore(store);
    sendToAppsScript('SARPRAS', 'UPDATE', store.sarpras[index]);
    res.json({ success: true, data: store.sarpras[index], message: 'Barang sarpras berhasil diperbarui' });
  });

  // Delete Sarpras
  app.delete('/api/sarpras/:id', (req: Request, res: Response) => {
    store.sarpras = store.sarpras.filter(s => s.id !== req.params.id);
    saveStore(store);
    sendToAppsScript('SARPRAS', 'DELETE', null, req.params.id);
    res.json({ success: true, message: 'Barang sarpras berhasil dihapus' });
  });

  // Admin Authentication Endpoint against Spreadsheet Database
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email administrator dan password wajib diisi.' });
    }

    const inputEmail = String(email).trim().toLowerCase();
    const inputPass = String(password).trim();
    const hashedInput = crypto.createHash('sha256').update(inputPass).digest('hex');

    const admin = store.admins.find(a => 
      (a.email && a.email.toLowerCase() === inputEmail) || 
      (a.username && a.username.toLowerCase() === inputEmail)
    );

    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email administrator tidak terdaftar dalam database Spreadsheet ADMINS.' 
      });
    }

    if (admin.status === 'Nonaktif') {
      return res.status(403).json({ 
        success: false, 
        message: 'Akun administrator ini berstatus Nonaktif.' 
      });
    }

    const storedPass = (admin.password_hash || '').trim();
    const isPasswordValid = storedPass === inputPass || storedPass === hashedInput;

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Password yang Anda masukkan salah.' 
      });
    }

    const session: AdminSession = {
      uid: admin.id || `ADM-${Date.now()}`,
      email: admin.email,
      displayName: admin.nama || admin.username || 'Admin Sarpras',
      role: (admin.role as any) || 'Petugas Sarpras'
    };

    return res.json({
      success: true,
      message: 'Login berhasil',
      session
    });
  });

  // Get All Admins
  app.get('/api/admins', (req: Request, res: Response) => {
    res.json({ success: true, data: store.admins });
  });

  // Create Admin User
  app.post('/api/admins', (req: Request, res: Response) => {
    const newAdmin: AdminUser = {
      id: req.body.id || `ADM-${String(store.admins.length + 1).padStart(3, '0')}`,
      nama: req.body.nama || 'User Admin',
      username: req.body.username || `user_${Date.now()}`,
      email: req.body.email || `user_${Date.now()}@smkn1batumandi.sch.id`,
      password_hash: req.body.password_hash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      role: req.body.role || 'Petugas Sarpras',
      status: req.body.status || 'Aktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.admins.push(newAdmin);
    saveStore(store);
    sendToAppsScript('ADMINS', 'INSERT', newAdmin);
    res.status(201).json({ success: true, data: newAdmin, message: 'Admin user berhasil ditambahkan' });
  });

  // Update Admin User
  app.put('/api/admins/:id', (req: Request, res: Response) => {
    const index = store.admins.findIndex(a => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User admin tidak ditemukan' });
    }

    store.admins[index] = {
      ...store.admins[index],
      ...req.body,
      updated_at: new Date().toISOString()
    };

    saveStore(store);
    sendToAppsScript('ADMINS', 'UPDATE', store.admins[index]);
    res.json({ success: true, data: store.admins[index], message: 'User admin berhasil diperbarui' });
  });

  // Delete Admin User
  app.delete('/api/admins/:id', (req: Request, res: Response) => {
    store.admins = store.admins.filter(a => a.id !== req.params.id);
    saveStore(store);
    sendToAppsScript('ADMINS', 'DELETE', null, req.params.id);
    res.json({ success: true, message: 'User admin berhasil dihapus' });
  });

  // Push All Initial Data (ROOMS, SARPRAS, ADMINS) to Google Apps Script
  app.post('/api/sheets/push-all', async (req: Request, res: Response) => {
    try {
      // Sync Admins
      for (const admin of store.admins) {
        await sendToAppsScript('ADMINS', 'INSERT', admin);
      }
      // Sync Rooms
      for (const room of store.rooms) {
        await sendToAppsScript('ROOMS', 'INSERT', room);
      }
      // Sync Sarpras
      for (const item of store.sarpras) {
        await sendToAppsScript('SARPRAS', 'INSERT', item);
      }
      res.json({
        success: true,
        message: 'Semua data (ROOMS, SARPRAS, ADMINS) berhasil dikirim ke Google Apps Script / Google Sheets',
        adminsCount: store.admins.length,
        roomsCount: store.rooms.length,
        sarprasCount: store.sarpras.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Trigger Refresh / Sync from Google Sheets
  app.get('/api/sheets/sync', async (req: Request, res: Response) => {
    await syncWithGoogleSheets();
    res.json({
      success: true,
      message: 'Sinkronisasi dengan Google Spreadsheet selesai',
      spreadsheetId: SPREADSHEET_ID,
      lastUpdated: store.lastUpdated,
      roomsCount: store.rooms.length,
      sarprasCount: store.sarpras.length,
      isSyncedWithSheets: store.isSyncedWithSheets
    });
  });

  // Export CSV endpoint (for admin downloading latest format or syncing to Google Sheets)
  app.get('/api/sheets/export-csv/:sheetName', (req: Request, res: Response) => {
    const sheetName = req.params.sheetName.toUpperCase();
    let csvData = '';

    if (sheetName === 'ROOMS') {
      const formatted = store.rooms.map(r => ({
        ...r,
        posisi_siteplan: JSON.stringify(r.posisi_siteplan)
      }));
      csvData = Papa.unparse(formatted);
    } else if (sheetName === 'SARPRAS') {
      csvData = Papa.unparse(store.sarpras);
    } else {
      csvData = Papa.unparse(store.admins);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="SMKN1_Batumandi_${sheetName}.csv"`);
    res.send(csvData);
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SMKN 1 Batumandi running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
