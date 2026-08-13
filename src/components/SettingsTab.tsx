import React, { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_APP_SETTINGS, loadAppSettings, saveAppSettingsToStorage, AdminUser } from '../types';
import { 
  Settings, 
  Image, 
  FileText, 
  UserCheck, 
  Users, 
  Plus, 
  KeyRound, 
  Trash2, 
  Save, 
  CheckCircle2, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  Upload, 
  Eye, 
  X,
  Sparkles,
  Info,
  MapPin
} from 'lucide-react';
import { createAdmin, updateAdmin, deleteAdmin, getAppSettings, saveAppSettings } from '../services/apiService';

interface SettingsTabProps {
  admins: AdminUser[];
  onAdminsUpdated: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ admins, onAdminsUpdated }) => {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<'kop' | 'signatures' | 'about' | 'admins'>('kop');

  // Modal Admin States
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    role: 'Petugas Sarpras' as 'Super Admin' | 'Petugas Sarpras'
  });

  const [resetPassModalAdmin, setResetPassModalAdmin] = useState<AdminUser | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    getAppSettings().then(s => {
      if (mounted && s) {
        setSettings(s);
      }
    }).catch(e => console.error('Failed to load settings from server:', e));
    return () => { mounted = false; };
  }, []);

  // Handle image upload convert to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file gambar maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, kopSekolahUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await saveAppSettings(settings);
      setSaveSuccess('Pengaturan Kop Sekolah & Penandatangan Laporan Berhasil Disimpan ke Server & Google Sheets!');
      setTimeout(() => setSaveSuccess(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset to default settings
  const handleResetSettings = async () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan pengaturan laporan ke standar default SMKN 1 Batumandi?')) {
      setIsSavingSettings(true);
      try {
        setSettings(DEFAULT_APP_SETTINGS);
        await saveAppSettings(DEFAULT_APP_SETTINGS);
        setSaveSuccess('Pengaturan dikembalikan ke standar awal.');
        setTimeout(() => setSaveSuccess(''), 4000);
      } catch (e) {
      } finally {
        setIsSavingSettings(false);
      }
    }
  };

  // Handle Add Admin
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.nama || !newAdmin.email || !newAdmin.password) {
      setAdminError('Nama, email, dan password wajib diisi.');
      return;
    }

    setSavingAdmin(true);
    setAdminError('');

    try {
      const created = await createAdmin({
        nama: newAdmin.nama,
        username: newAdmin.username || newAdmin.email.split('@')[0],
        email: newAdmin.email,
        password_hash: newAdmin.password,
        role: newAdmin.role,
        status: 'Aktif'
      });

      // Local storage backup for offline custom admin auth
      const savedAdminsStr = localStorage.getItem('smk_custom_admins_store');
      let customAdmins: any[] = [];
      if (savedAdminsStr) {
        try { customAdmins = JSON.parse(savedAdminsStr); } catch (err) {}
      }
      customAdmins = customAdmins.filter(a => a.email !== newAdmin.email);
      customAdmins.push({
        id: created.id || `ADM-${Date.now()}`,
        nama: newAdmin.nama,
        username: newAdmin.username || newAdmin.email.split('@')[0],
        email: newAdmin.email,
        role: newAdmin.role,
        custom_password: newAdmin.password,
        status: 'Aktif'
      });
      localStorage.setItem('smk_custom_admins_store', JSON.stringify(customAdmins));

      setAdminSuccess(`Akun admin "${newAdmin.nama}" berhasil ditambahkan! Password: ${newAdmin.password}`);
      setNewAdmin({ nama: '', username: '', email: '', password: '', role: 'Petugas Sarpras' });
      setShowAddAdminModal(false);
      onAdminsUpdated();
      setTimeout(() => setAdminSuccess(''), 5000);
    } catch (err: any) {
      setAdminError(err.message || 'Gagal menambahkan akun admin.');
    } finally {
      setSavingAdmin(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassModalAdmin || !newResetPassword) return;

    setSavingAdmin(true);
    setAdminError('');

    try {
      await updateAdmin(resetPassModalAdmin.id, {
        password_hash: newResetPassword,
        status: 'Aktif'
      });

      // Update custom local storage store
      const savedAdminsStr = localStorage.getItem('smk_custom_admins_store');
      let customAdmins: any[] = [];
      if (savedAdminsStr) {
        try { customAdmins = JSON.parse(savedAdminsStr); } catch (err) {}
      }
      const existingIdx = customAdmins.findIndex(a => a.id === resetPassModalAdmin.id || a.email === resetPassModalAdmin.email);
      if (existingIdx >= 0) {
        customAdmins[existingIdx].custom_password = newResetPassword;
      } else {
        customAdmins.push({
          id: resetPassModalAdmin.id,
          nama: resetPassModalAdmin.nama,
          email: resetPassModalAdmin.email,
          role: resetPassModalAdmin.role,
          custom_password: newResetPassword,
          status: 'Aktif'
        });
      }
      localStorage.setItem('smk_custom_admins_store', JSON.stringify(customAdmins));

      setAdminSuccess(`Password untuk admin ${resetPassModalAdmin.nama} berhasil diperbarui menjadi "${newResetPassword}".`);
      setResetPassModalAdmin(null);
      setNewResetPassword('');
      onAdminsUpdated();
      setTimeout(() => setAdminSuccess(''), 5000);
    } catch (err: any) {
      setAdminError(err.message || 'Gagal mereset password.');
    } finally {
      setSavingAdmin(false);
    }
  };

  // Handle Delete Admin
  const handleDeleteAdminClick = async (admin: AdminUser) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun admin "${admin.nama}"?`)) {
      try {
        await deleteAdmin(admin.id);
        const savedAdminsStr = localStorage.getItem('smk_custom_admins_store');
        if (savedAdminsStr) {
          try {
            const customAdmins = JSON.parse(savedAdminsStr).filter((a: any) => a.id !== admin.id && a.email !== admin.email);
            localStorage.setItem('smk_custom_admins_store', JSON.stringify(customAdmins));
          } catch (e) {}
        }
        setAdminSuccess(`Akun admin ${admin.nama} berhasil dihapus.`);
        onAdminsUpdated();
        setTimeout(() => setAdminSuccess(''), 4000);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus admin.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Settings Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Pengaturan Sistem &amp; Laporan Sarpras
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Atur format Kop Sekolah, data penandatangan Kepala Sekolah &amp; Pengelola Sarpras, serta kelola akun admin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSettings}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Standar</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {adminSuccess && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{adminSuccess}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('kop')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeSection === 'kop'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Image className="w-4 h-4" />
          1. Kop Sekolah &amp; Laporan
        </button>

        <button
          onClick={() => setActiveSection('signatures')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeSection === 'signatures'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          2. Penandatangan Pejabat
        </button>

        <button
          onClick={() => setActiveSection('about')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeSection === 'about'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Info className="w-4 h-4" />
          3. Tampilan "Tentang" Landing Page
        </button>

        <button
          onClick={() => setActiveSection('admins')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeSection === 'admins'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          4. Akun Admin ({admins.length})
        </button>
      </div>

      {/* SECTION 1: KOP SEKOLAH & HEADER */}
      {activeSection === 'kop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
              <Image className="w-4 h-4 text-indigo-600" />
              Pengaturan Gambar &amp; Teks Kop Surat Laporan
            </h3>

            {/* Link Kop / Upload Gambar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                URL Gambar Kop Sekolah / Banner Header:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.kopSekolahUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, kopSekolahUrl: e.target.value }))}
                  placeholder="https:// domain.com/kop-sekolah.png atau kosongkan untuk teks default"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 border border-slate-300">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Jika diisi, gambar ini akan ditampilkan paling atas pada cetakan laporan PDF/printer. Jika kosong, sistem menggunakan format teks standar pemerintah di bawah ini.
              </p>
            </div>

            {/* Teks Identitas Sekolah */}
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Instansi / Dinas Naungan:
                </label>
                <input
                  type="text"
                  value={settings.namaInstansi}
                  onChange={(e) => setSettings(prev => ({ ...prev, namaInstansi: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Sekolah Utama:
                </label>
                <input
                  type="text"
                  value={settings.namaSekolah}
                  onChange={(e) => setSettings(prev => ({ ...prev, namaSekolah: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-extrabold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Sekolah:
                </label>
                <input
                  type="text"
                  value={settings.alamatSekolah}
                  onChange={(e) => setSettings(prev => ({ ...prev, alamatSekolah: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website, Email, &amp; Kontak:
                </label>
                <input
                  type="text"
                  value={settings.kontakSekolah}
                  onChange={(e) => setSettings(prev => ({ ...prev, kontakSekolah: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                />
              </div>
            </div>

          </div>

          {/* Live Preview Box Header */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4" /> Live Preview Kop Cetak Laporan
              </div>

              <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-inner min-h-[220px] flex flex-col justify-center items-center text-center">
                {settings.kopSekolahUrl ? (
                  <div className="space-y-2 w-full">
                    <img 
                      src={settings.kopSekolahUrl} 
                      alt="Kop Sekolah Header" 
                      className="max-h-24 mx-auto object-contain"
                    />
                    <div className="border-b-2 border-double border-slate-900 pt-2" />
                  </div>
                ) : (
                  <div className="border-b-4 border-double border-slate-900 pb-3 w-full">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{settings.namaInstansi}</h4>
                    <h3 className="text-sm font-black uppercase text-slate-950 mt-0.5">{settings.namaSekolah}</h3>
                    <p className="text-[9px] text-slate-600 mt-1 leading-tight">{settings.alamatSekolah}</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">{settings.kontakSekolah}</p>
                  </div>
                )}

                <div className="mt-4 w-full">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">LAPORAN INVENTARIS SARANA DAN PRASARANA</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Status: Siap dicetak sesuai Kop terkini</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl text-[11px] text-slate-400 border border-slate-800">
              💡 Kop di atas akan digunakan secara otomatis ketika Anda menekan tombol <strong>Cetak Laporan / PDF</strong> di tab Sarpras.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PENANDATANGAN LAPAN */}
      {activeSection === 'signatures' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Data Pejabat Penandatangan Laporan
            </h3>

            {/* DATA KEPALA SEKOLAH */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
              <div className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                1. Data Kepala Sekolah (Mengetahui)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap &amp; Gelar:
                  </label>
                  <input
                    type="text"
                    value={settings.kepalaSekolahNama}
                    onChange={(e) => setSettings(prev => ({ ...prev, kepalaSekolahNama: e.target.value }))}
                    placeholder="Contoh: H. Kastalani, S.Pd, M.Pd"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah:
                  </label>
                  <input
                    type="text"
                    value={settings.kepalaSekolahNip}
                    onChange={(e) => setSettings(prev => ({ ...prev, kepalaSekolahNip: e.target.value }))}
                    placeholder="Contoh: 19720512 199802 1 003"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Gelar Penutup:
                </label>
                <input
                  type="text"
                  value={settings.kepalaSekolahJabatan}
                  onChange={(e) => setSettings(prev => ({ ...prev, kepalaSekolahJabatan: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* DATA PENGELOLA SARPRAS */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
              <div className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                2. Data Pengelola Sarana &amp; Prasarana
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pengelola:
                  </label>
                  <input
                    type="text"
                    value={settings.pengelolaSarprasNama}
                    onChange={(e) => setSettings(prev => ({ ...prev, pengelolaSarprasNama: e.target.value }))}
                    placeholder="Contoh: Herman Syaufi, S.Kom"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Pengelola Sarpras:
                  </label>
                  <input
                    type="text"
                    value={settings.pengelolaSarprasNip}
                    onChange={(e) => setSettings(prev => ({ ...prev, pengelolaSarprasNip: e.target.value }))}
                    placeholder="Contoh: 19880914 201503 1 002 atau - jika non-NIP"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan Pengelola:
                </label>
                <input
                  type="text"
                  value={settings.pengelolaSarprasJabatan}
                  onChange={(e) => setSettings(prev => ({ ...prev, pengelolaSarprasJabatan: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

          </div>

          {/* Live Preview Box Signatures */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4" /> Live Preview Tanda Tangan Laporan
              </div>

              <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-inner space-y-6">
                <div className="text-[11px] font-bold text-slate-800 text-center border-b pb-2">
                  Format Blok Tanda Tangan Pada Halaman Terakhir Laporan:
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] text-center pt-2">
                  <div>
                    <p className="font-semibold text-slate-700">Mengetahui,<br />{settings.kepalaSekolahJabatan}</p>
                    <div className="h-14 flex items-center justify-center font-serif text-slate-300 italic">
                      [ Tanda Tangan ]
                    </div>
                    <p className="font-extrabold text-slate-900 underline">{settings.kepalaSekolahNama || '-'}</p>
                    <p className="text-[9px] text-slate-600 font-mono">NIP. {settings.kepalaSekolahNip || '-'}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700">Batumandi, Tanggal Laporan<br />{settings.pengelolaSarprasJabatan}</p>
                    <div className="h-14 flex items-center justify-center font-serif text-slate-300 italic">
                      [ Tanda Tangan ]
                    </div>
                    <p className="font-extrabold text-slate-900 underline">{settings.pengelolaSarprasNama || '-'}</p>
                    <p className="text-[9px] text-slate-600 font-mono">NIP. {settings.pengelolaSarprasNip || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl text-[11px] text-slate-400 border border-slate-800">
              💡 Data pejabat ini akan tercetak otomatis pada bagian bawah lembar Laporan Inventaris Sarpras.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: EDIT DATA TENTANG & LANDING PAGE */}
      {activeSection === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                Pengaturan Konten Tampilan "Tentang Sekolah"
              </h3>
              <span className="text-xs text-indigo-700 bg-indigo-50 font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                Tampil di Halaman Depan
              </span>
            </div>

            {/* Header / Badge & Tag */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                1. Label Badge &amp; Deskripsi Utama
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Kategori (Teks Atas):
                  </label>
                  <input
                    type="text"
                    value={settings.aboutBadgeText}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutBadgeText: e.target.value }))}
                    placeholder="Contoh: Profil Sekolah Resmi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tag Wilayah / Sub-label:
                  </label>
                  <input
                    type="text"
                    value={settings.aboutTagText}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutTagText: e.target.value }))}
                    placeholder="Contoh: Kabupaten Balangan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Ringkas Sekolah:
                </label>
                <textarea
                  rows={2}
                  value={settings.aboutDeskripsi}
                  onChange={(e) => setSettings(prev => ({ ...prev, aboutDeskripsi: e.target.value }))}
                  placeholder="Deskripsi singkat mengenai sekolah..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* 3 Information Cards */}
            <div className="space-y-5">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                2. Tiga Kartu Informasi Unggulan
              </h4>

              {/* Card 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Kartu 1 (Program Keahlian / Keunggulan)</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={settings.aboutCard1Judul}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutCard1Judul: e.target.value }))}
                    placeholder="Judul Kartu 1 (e.g. Program Keahlian Utama)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                  <textarea
                    rows={3}
                    value={settings.aboutCard1Isi}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutCard1Isi: e.target.value }))}
                    placeholder="Isi konten (Gunakan enter/baris baru untuk poin-poin)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500">
                    💡 Tip: Setiap baris baru akan ditampilkan sebagai poin list otomatis.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Kartu 2 (Lokasi &amp; Kontak)</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={settings.aboutCard2Judul}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutCard2Judul: e.target.value }))}
                    placeholder="Judul Kartu 2 (e.g. Lokasi &amp; Kontak)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                  <textarea
                    rows={3}
                    value={settings.aboutCard2Isi}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutCard2Isi: e.target.value }))}
                    placeholder="Alamat sekolah, email, telepon, dsb..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Kartu 3 (Sistem / Keterangan Lain)</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={settings.aboutCard3Judul}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutCard3Judul: e.target.value }))}
                    placeholder="Judul Kartu 3 (e.g. Sistem Sarpras Terpadu)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                  />
                  <textarea
                    rows={3}
                    value={settings.aboutCard3Isi}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutCard3Isi: e.target.value }))}
                    placeholder="Penjelasan sistem atau visi misi sarpras..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Live Preview Box About */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4" /> Preview Tampilan "Tentang"
              </div>

              <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-300 space-y-4 shadow-inner">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="w-10 h-10 rounded-lg bg-indigo-700 text-white font-black text-lg flex items-center justify-center shrink-0">
                    {settings.namaSekolah ? settings.namaSekolah.trim().charAt(0) : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[9px] font-bold">
                      <span className="text-indigo-700">{settings.aboutBadgeText}</span>
                      {settings.aboutTagText && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">{settings.aboutTagText}</span>
                      )}
                    </div>
                    <div className="text-sm font-extrabold text-indigo-950 leading-tight">
                      {settings.namaSekolah || 'SMK Negeri 1 Batumandi'}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 leading-snug">
                  {settings.aboutDeskripsi}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                    <div className="font-bold text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                      {settings.aboutCard1Judul}
                    </div>
                    <div className="text-slate-600 mt-1 line-clamp-2 whitespace-pre-line text-[9px]">
                      {settings.aboutCard1Isi}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                    <div className="font-bold text-indigo-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      {settings.aboutCard2Judul}
                    </div>
                    <div className="text-slate-600 mt-1 line-clamp-2 whitespace-pre-line text-[9px]">
                      {settings.aboutCard2Isi}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl text-[11px] text-slate-400 border border-slate-800">
              💡 Perubahan yang disimpan akan langsung terintegrasi secara otomatis pada menu "Tentang &amp; Database" di halaman depan publik.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: KELOLA AKUN ADMIN & RESET PASSWORD */}
      {activeSection === 'admins' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Manajemen Akun Admin &amp; Petugas Sarpras
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Tambahkan akun admin baru, reset password, atau atur hak akses pengguna sistem.
              </p>
            </div>

            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Admin Baru</span>
            </button>
          </div>

          {/* Admin Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                  <th className="p-3">ID Admin</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Username / Email</th>
                  <th className="p-3">Role Hak Akses</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi &amp; Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-[11px] font-bold text-slate-600">{adm.id}</td>
                    <td className="p-3 font-bold text-slate-900">{adm.nama}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{adm.email}</div>
                      {adm.username && <div className="text-[10px] text-slate-500 font-mono">@{adm.username}</div>}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        adm.role === 'Super Admin' 
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {adm.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                        {adm.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setResetPassModalAdmin(adm);
                          setNewResetPassword('');
                        }}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        title="Reset Password Admin Ini"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reset Password</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAdminClick(adm)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs transition-colors inline-flex items-center justify-center"
                        title="Hapus Akun Admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ADMIN */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Tambah Akun Admin Baru
              </h3>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAddAdminSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newAdmin.nama}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Contoh: Ahmad Syarif"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email * (Login Email)</label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ahmad@smkn1batumandi.sch.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username (Opsional)</label>
                  <input
                    type="text"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="ahmad_sarpras"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role Hak Akses *</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  >
                    <option value="Petugas Sarpras">Petugas Sarpras</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password Login *</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Masukkan password admin"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdmin}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingAdmin ? 'Menyimpan...' : 'Simpan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPassModalAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Reset Password Admin
              </h3>
              <button 
                onClick={() => setResetPassModalAdmin(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold">
              Mereset password untuk akun: <strong>{resetPassModalAdmin.nama}</strong> ({resetPassModalAdmin.email})
            </div>

            <form onSubmit={handleResetPassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Password Baru *</label>
                <input
                  type="text"
                  required
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="Ketik password baru (cth: admin123)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewResetPassword('admin123')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg"
                >
                  Gunakan Standard "admin123"
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setResetPassModalAdmin(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdmin || !newResetPassword}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{savingAdmin ? 'Menyimpan...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
