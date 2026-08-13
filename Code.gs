/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT (Code.gs)
 * SISTEM INFORMASI SARANA & PRASARANA - SMKN 1 BATUMANDI
 * ==============================================================================
 * Script ini digunakan untuk membuat, mengelola, dan mensinkronisasi data secara otomatis
 * dari Web Portal Sarpras SMKN 1 Batumandi langsung ke Google Spreadsheet secara Real-Time.
 * 
 * PETUNJUK PENGGUNAAN:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu "Ekstensi" -> "Apps Script" (Extensions -> Apps Script).
 * 3. Hapus semua kode bawaan, lalu Paste seluruh kode ini ke dalam file Code.gs.
 * 4. Klik tombol "Simpan" (Ctrl+S).
 * 5. Jalankan fungsi "setupDatabase" atau gunakan Menu "🚀 SMKN 1 Batumandi" di Google Sheets!
 * 6. Untuk akses Webhook otomatis: Klik "Terapkan" (Deploy) -> "Terapkan sebagai Aplikasi Web" (Web App).
 *    - Akses (Who has access): Siapa Saja (Anyone).
 * ==============================================================================
 */

// Menambahkan Menu Khusus saat Spreadsheet dibuka
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 SMKN 1 Batumandi')
    .addItem('1. Inisialisasi Database Otomatis (ROOMS & SARPRAS)', 'setupDatabase')
    .addItem('2. Isi Data Awal Sarpras SMKN 1 Batumandi', 'seedDataDefault')
    .addSeparator()
    .addItem('3. Rapikan Format Tampilan Tabel', 'formatSheetsVisual')
    .addToUi();
}

/**
 * Membuat Sheet 'ROOMS' dan 'SARPRAS' beserta Header Kolom
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Sheet ROOMS
  var sheetRooms = ss.getSheetByName('ROOMS') || ss.insertSheet('ROOMS');
  var headersRooms = [
    'id', 'kode_ruangan', 'nama_ruangan', 'jenis_ruangan', 'lantai', 
    'posisi_siteplan', 'deskripsi', 'foto', 'status', 'created_at'
  ];
  sheetRooms.getRange(1, 1, 1, headersRooms.length).setValues([headersRooms]);
  formatHeaderRow(sheetRooms, headersRooms.length, '#1e1b4b'); // Dark Indigo
  sheetRooms.setFrozenRows(1);

  // 3. Setup Sheet ADMINS (Data User & Hashed Passwords)
  var sheetAdmins = ss.getSheetByName('ADMINS') || ss.insertSheet('ADMINS');
  var headersAdmins = [
    'id', 'nama', 'username', 'email', 'password_hash', 'role', 'status', 'created_at', 'updated_at'
  ];
  sheetAdmins.getRange(1, 1, 1, headersAdmins.length).setValues([headersAdmins]);
  formatHeaderRow(sheetAdmins, headersAdmins.length, '#831843'); // Dark Rose
  sheetAdmins.setFrozenRows(1);

  // 4. Setup Sheet SETTINGS (Pengaturan Sistem, Kop, & Pejabat)
  var sheetSettings = ss.getSheetByName('SETTINGS') || ss.insertSheet('SETTINGS');
  var headersSettings = [
    'id', 'kopSekolahUrl', 'namaInstansi', 'namaSekolah', 'alamatSekolah', 
    'kontakSekolah', 'kepalaSekolahNama', 'kepalaSekolahNip', 'kepalaSekolahJabatan', 
    'pengelolaSarprasNama', 'pengelolaSarprasNip', 'pengelolaSarprasJabatan', 
    'aboutBadgeText', 'aboutTagText', 'aboutDeskripsi', 'aboutCard1Judul', 
    'aboutCard1Isi', 'aboutCard2Judul', 'aboutCard2Isi', 'aboutCard3Judul', 'aboutCard3Isi'
  ];
  sheetSettings.getRange(1, 1, 1, headersSettings.length).setValues([headersSettings]);
  formatHeaderRow(sheetSettings, headersSettings.length, '#312e81'); // Dark Indigo
  sheetSettings.setFrozenRows(1);

  autoResizeColumns(sheetRooms, headersRooms.length);
  autoResizeColumns(sheetSarpras, headersSarpras.length);
  autoResizeColumns(sheetAdmins, headersAdmins.length);
  autoResizeColumns(sheetSettings, headersSettings.length);

  SpreadsheetApp.getUi().alert('✅ Berhasil!\n\nStruktur Database Google Sheets untuk SMKN 1 Batumandi telah siap:\n- Sheet ROOMS\n- Sheet SARPRAS\n- Sheet ADMINS\n- Sheet SETTINGS');
}

/**
 * Mengisi Data Sampel Awal Ruangan & Sarpras
 */
function seedDataDefault() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupDatabase();

  var sheetRooms = ss.getSheetByName('ROOMS');
  var sheetSarpras = ss.getSheetByName('SARPRAS');

  if (sheetRooms.getLastRow() === 1) {
    var sampleRooms = [
      ['ROOM-001', 'LAB-RPL-1', 'Laboratorium RPL 1', 'Laboratorium', 1, '{"x":120,"y":80,"width":140,"height":90,"color":"#3b82f6"}', 'Lab Komputer Rekayasa Perangkat Lunak', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97', 'Aktif', new Date().toISOString()],
      ['ROOM-002', 'LAB-TKJ-1', 'Laboratorium TKJ 1', 'Laboratorium', 1, '{"x":280,"y":80,"width":140,"height":90,"color":"#10b981"}', 'Lab Komputer Teknik Komputer & Jaringan', 'https://images.unsplash.com/photo-1588702547919-26089e690ecc', 'Aktif', new Date().toISOString()],
      ['ROOM-003', 'R-TEO-01', 'Ruang Kelas X RPL 1', 'Ruang Kelas', 2, '{"x":120,"y":200,"width":120,"height":80,"color":"#8b5cf6"}', 'Ruang Teori Belajar Mengajar', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b', 'Aktif', new Date().toISOString()],
      ['ROOM-004', 'AULA-UTAMA', 'Aula Utama SMKN 1 Batumandi', 'Aula / Gedung Pertemuan', 1, '{"x":450,"y":80,"width":200,"height":140,"color":"#f59e0b"}', 'Aula Serbaguna Acara & Seminar', 'https://images.unsplash.com/photo-1511578314322-379afb476865', 'Aktif', new Date().toISOString()],
      ['ROOM-005', 'PERPUS-01', 'Perpustakaan Digital SMKN 1', 'Perpustakaan', 1, '{"x":450,"y":240,"width":150,"height":100,"color":"#ec4899"}', 'Perpustakaan & Ruang Baca', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da', 'Aktif', new Date().toISOString()]
    ];
    sheetRooms.getRange(2, 1, sampleRooms.length, sampleRooms[0].length).setValues(sampleRooms);
  }

  if (sheetSarpras.getLastRow() === 1) {
    var sampleSarpras = [
      ['SRP-001', 'ROOM-001', 'PC Client All-In-One Intel Core i5', 'Elektronik / Komputer', 'Lenovo', 'Core i5-11400, RAM 16GB, SSD 512GB, Display 23.8"', 'Baik', 25, 'Unit', '2023', 'DAK Fisik SMK', 'Kondisi mulus terinstall Windows 11 & VS Code', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-002', 'ROOM-001', 'Proyektor HDMI High Brightness', 'Elektronik', 'Epson', 'EB-X500 3600 Lumens XGA', 'Baik', 1, 'Unit', '2022', 'BOS Reguler', 'Terpasang di plafon lab', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-003', 'ROOM-002', 'Switch Manageable 24 Port Gigabit', 'Jaringan', 'Cisco', 'SG250-28 28-Port Gigabit Smart Switch', 'Baik', 2, 'Unit', '2022', 'BOS Reguler', 'Terpasang di Rack Server TKJ', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-004', 'ROOM-003', 'Kursi Siswa Futura Steel', 'Mebel / Mebeler', 'Futura', 'Rangka Pipa Besi, Busa Uphosltery Blue', 'Baik', 36, 'Buah', '2021', 'Komite Sekolah', 'Gunakan untuk ruang teori', '', new Date().toISOString(), new Date().toISOString()],
      ['SRP-005', 'ROOM-004', 'Sound System Active Array 15 Inch', 'Audio System', 'Baretone', '15 Inch Active Speaker + Wireless Mic', 'Rusak Ringan', 2, 'Set', '2021', 'BOS Reguler', 'Mic wireless channel 2 terkadang noise', '', new Date().toISOString(), new Date().toISOString()]
    ];
    sheetSarpras.getRange(2, 1, sampleSarpras.length, sampleSarpras[0].length).setValues(sampleSarpras);
  }

  autoResizeColumns(sheetRooms, 10);
  autoResizeColumns(sheetSarpras, 15);

  SpreadsheetApp.getUi().alert('🎉 Berhasil mengisi data awal SMKN 1 Batumandi!');
}

function formatHeaderRow(sheet, numColumns, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, numColumns);
  headerRange.setBackground(bgColor)
             .setFontColor('#ffffff')
             .setFontWeight('bold')
             .setFontSize(10)
             .setVerticalAlignment('middle')
             .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 35);
}

function autoResizeColumns(sheet, numColumns) {
  for (var c = 1; c <= numColumns; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * Endpoint GET: Membaca Data
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet.toUpperCase() : 'ROOMS';
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet ' + sheetName + ' tidak ditemukan' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint POST: Menerima Perubahan Data (INSERT, UPDATE, DELETE, BULK) dari Website
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || 'INSERT';
    var sheetName = (body.sheet || 'ROOMS').toUpperCase();
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];

    // Handle INSERT
    if (action === 'INSERT' && body.data) {
      var rowToAppend = [];
      for (var k = 0; k < headers.length; k++) {
        var val = body.data[headers[k]];
        if (typeof val === 'object') val = JSON.stringify(val);
        rowToAppend.push(val !== undefined ? val : '');
      }
      sheet.appendRow(rowToAppend);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data berhasil ditambahkan ke Google Sheets' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handle UPDATE
    if (action === 'UPDATE' && body.data) {
      if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
        headers = Object.keys(body.data);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        formatHeaderRow(sheet, headers.length, '#312e81');
      }

      var dataValues = sheet.getDataRange().getValues();
      var idIndex = headers.indexOf('id');
      var updatedRow = false;

      if (idIndex !== -1 && body.data.id) {
        for (var r = 1; r < dataValues.length; r++) {
          if (String(dataValues[r][idIndex]) === String(body.data.id)) {
            for (var c = 0; c < headers.length; c++) {
              var colKey = headers[c];
              if (body.data[colKey] !== undefined) {
                var newCellVal = body.data[colKey];
                if (typeof newCellVal === 'object') newCellVal = JSON.stringify(newCellVal);
                sheet.getRange(r + 1, c + 1).setValue(newCellVal);
              }
            }
            updatedRow = true;
            break;
          }
        }
      }

      if (!updatedRow) {
        var newRowVals = [];
        for (var k = 0; k < headers.length; k++) {
          var val = body.data[headers[k]];
          if (typeof val === 'object') val = JSON.stringify(val);
          newRowVals.push(val !== undefined ? val : '');
        }
        sheet.appendRow(newRowVals);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data berhasil diperbarui ke Google Sheets' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handle DELETE
    if (action === 'DELETE' && body.id) {
      var dataVals = sheet.getDataRange().getValues();
      var idCol = headers.indexOf('id');
      if (idCol !== -1) {
        for (var rowIdx = dataVals.length - 1; rowIdx >= 1; rowIdx--) {
          if (String(dataVals[rowIdx][idCol]) === String(body.id)) {
            sheet.deleteRow(rowIdx + 1);
            return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data ID ' + body.id + ' berhasil dihapus' }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Aksi diproses' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
