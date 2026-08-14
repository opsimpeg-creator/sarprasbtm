import React, { useState, useEffect, useRef } from 'react';
import { Room, Sarpras, StatsSummary, FilterState } from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InteractiveSiteplan } from './components/InteractiveSiteplan';
import { RoomDetailModal } from './components/RoomDetailModal';
import { AboutSection } from './components/AboutSection';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { getRooms, getAllSarpras, getStats, syncSheetsData, getRoomById } from './services/apiService';
import { getStoredAdminSession, AdminSession, logoutAdmin } from './firebase/config';
import { AlertCircle, RefreshCw, Building2, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'siteplan' | 'about' | 'admin'>('home');
  const [adminSession, setAdminSession] = useState<AdminSession | null>(getStoredAdminSession());

  const [rooms, setRooms] = useState<Room[]>([]);
  const [sarpras, setSarpras] = useState<Sarpras[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Selected room for detailed modal
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomSarpras, setSelectedRoomSarpras] = useState<Sarpras[]>([]);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedJenis: 'Semua',
    selectedKondisi: 'Semua',
    selectedRoomId: null
  });

  const siteplanRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [roomsData, sarprasList, statsData] = await Promise.all([
        getRooms(),
        getAllSarpras(),
        getStats()
      ]);
      setRooms(roomsData);
      setSarpras(sarprasList);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg('Data Sarana dan Prasarana sedang tidak dapat dimuat. Silakan coba kembali beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map of roomId -> sarpras count
  const sarprasMap: Record<string, number> = {};
  sarpras.forEach(item => {
    sarprasMap[item.room_id] = (sarprasMap[item.room_id] || 0) + item.jumlah;
  });

  const handleSelectRoom = async (room: Room) => {
    setSelectedRoom(room);
    try {
      const detail = await getRoomById(room.id);
      setSelectedRoomSarpras(detail.sarpras_list || []);
    } catch (e) {
      // Fallback local filtering
      setSelectedRoomSarpras(sarpras.filter(s => s.room_id === room.id));
    }
  };

  const handleRefreshSheets = async () => {
    setIsSyncing(true);
    try {
      await syncSheetsData();
      await loadData();
    } catch (e) {
      console.error('Refresh sheets failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAdminSession(null);
    setCurrentTab('home');
  };

  const scrollToSiteplan = () => {
    if (siteplanRef.current) {
      siteplanRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Official Header Navbar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        adminSession={adminSession}
        onLogout={handleLogout}
        lastUpdated={stats?.lastUpdated}
        isSyncing={isSyncing}
        onRefreshSheets={handleRefreshSheets}
        spreadsheetId={(import.meta.env.VITE_GOOGLE_SHEETS_ID || import.meta.env.VITE_SPREADSHEET_ID || '') as string}
      />

      {/* Main Container Views */}
      <div className="flex-1">
        
        {/* VIEW 1: HOME & SITEPLAN */}
        {currentTab === 'home' && (
          <div className="space-y-8 pb-12">
            
            {/* Hero Banner */}
            <HeroSection
              searchQuery={filterState.searchQuery}
              onSearchChange={(query) => setFilterState(prev => ({ ...prev, searchQuery: query }))}
              stats={stats}
              onScrollToSiteplan={scrollToSiteplan}
            />

            {/* Error Banner */}
            {errorMsg && (
              <div className="max-w-7xl mx-auto px-4">
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    onClick={loadData}
                    className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500 shrink-0"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Siteplan Canvas Section */}
            <section ref={siteplanRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-blue-500" />
                    Peta Siteplan SMKN 1 Batumandi
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik pada setiap gedung untuk menampilkan daftar detail barang dan kondisi sarana prasarana.
                  </p>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Google Sheets DB Sync</span>
                </div>
              </div>

              {loading ? (
                <div className="w-full h-96 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Memuat Data Siteplan SMKN 1 Batumandi...</p>
                </div>
              ) : (
                <InteractiveSiteplan
                  rooms={rooms}
                  sarprasMap={sarprasMap}
                  selectedRoom={selectedRoom}
                  onSelectRoom={handleSelectRoom}
                  filterState={filterState}
                  onFilterChange={(newFilters) => setFilterState(prev => ({ ...prev, ...newFilters }))}
                />
              )}

            </section>

          </div>
        )}

        {/* VIEW 2: ABOUT & DATABASE CONFIG */}
        {currentTab === 'about' && (
          <AboutSection />
        )}

        {/* VIEW 3: ADMIN PAGE */}
        {currentTab === 'admin' && (
          adminSession ? (
            <AdminDashboard
              adminSession={adminSession}
              onGoToHome={() => setCurrentTab('home')}
            />
          ) : (
            <AdminLoginPage
              onSuccess={(session) => {
                setAdminSession(session);
                setCurrentTab('admin');
              }}
              onBackToHome={() => setCurrentTab('home')}
            />
          )
        )}

      </div>

      {/* Room Detail Modal Overlay */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          sarprasList={selectedRoomSarpras}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* Official Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 text-slate-400 text-xs py-8 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">SMKN 1 BATUMANDI</div>
              <div className="text-[11px] text-slate-400">Sistem Informasi Siteplan & Sarana Prasarana</div>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p>&copy; {new Date().getFullYear()} SMKN 1 Batumandi. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
