import React, { useState, useRef, useEffect } from 'react';
import { Room, JenisRuangan, FilterState, SiteplanDecorationItem, loadDecorationItems } from '../types';
import { Search, Filter, ZoomIn, ZoomOut, RotateCcw, MapPin, Eye, CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, Building2 } from 'lucide-react';

interface InteractiveSiteplanProps {
  rooms: Room[];
  sarprasMap: Record<string, number>; // roomId -> sarpras count
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

const ROOM_TYPE_COLORS: Record<JenisRuangan, string> = {
  'Kantor': '#1e3a8a',       // Deep Blue
  'Laboratorium': '#2563eb', // Blue
  'Bengkel': '#d97706',      // Amber/Orange
  'Ruang Kelas': '#059669',  // Emerald Green
  'Perpustakaan': '#7c3aed', // Purple
  'Fasilitas Umum': '#0284c7', // Sky Blue
  'Lapangan': '#16a34a',     // Green
  'Toilet': '#64748b',       // Slate
  'Lainnya': '#475569'       // Dark Slate
};

export const InteractiveSiteplan: React.FC<InteractiveSiteplanProps> = ({
  rooms,
  sarprasMap,
  selectedRoom,
  onSelectRoom,
  filterState,
  onFilterChange
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [showAllRooms, setShowAllRooms] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [decorations, setDecorations] = useState<SiteplanDecorationItem[]>(() => loadDecorationItems());

  useEffect(() => {
    const handleUpdate = () => {
      setDecorations(loadDecorationItems());
    };
    window.addEventListener('siteplanDecorationsUpdated', handleUpdate);
    return () => window.removeEventListener('siteplanDecorationsUpdated', handleUpdate);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.7));
  const handleResetZoom = () => setZoom(1);

  // Check if room matches search/filter
  const isRoomMatching = (room: Room) => {
    const query = filterState.searchQuery.toLowerCase().trim();
    const jenisMatch = filterState.selectedJenis === 'Semua' || room.jenis_ruangan === filterState.selectedJenis;

    if (!jenisMatch) return false;
    if (!query) return true;

    // Matches room code or room name or description
    const textMatch = 
      room.nama_ruangan.toLowerCase().includes(query) ||
      room.kode_ruangan.toLowerCase().includes(query) ||
      room.deskripsi.toLowerCase().includes(query);

    return textMatch;
  };

  const isFiltered = filterState.selectedJenis !== 'Semua' || Boolean(filterState.searchQuery.trim());
  const filteredRooms = rooms.filter(isRoomMatching);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Top Filter & Control Toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Kategori:
          </span>
          {['Semua', 'Ruang Kelas', 'Laboratorium', 'Bengkel', 'Kantor', 'Perpustakaan', 'Fasilitas Umum', 'Lapangan', 'Toilet'].map((kat) => (
            <button
              key={kat}
              onClick={() => onFilterChange({ selectedJenis: kat })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                filterState.selectedJenis === kat
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <div className="flex items-center bg-white rounded-md border border-slate-200 p-1 shadow-sm">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
              title="Perbesar Canvas"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-700 px-2 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
              title="Perkecil Canvas"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors border-l border-slate-200 ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Active Filter Notice Banner */}
      {isFiltered && (
        <div className="mx-4 my-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-950 font-medium">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Menampilkan <strong className="font-extrabold text-indigo-900">{filteredRooms.length} ruangan</strong>
              {filterState.selectedJenis !== 'Semua' && (
                <> untuk kategori <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded">{filterState.selectedJenis}</span></>
              )}
              {filterState.searchQuery && (
                <> dengan pencarian &quot;<strong>{filterState.searchQuery}</strong>&quot;</>
              )}
            </span>
          </div>
          <button
            onClick={() => onFilterChange({ selectedJenis: 'Semua', searchQuery: '' })}
            className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-300 rounded-lg shadow-2xs flex items-center gap-1 shrink-0 transition-colors"
          >
            Reset Filter (Tampilkan Semua)
          </button>
        </div>
      )}

      {/* Siteplan Canvas Container */}
      <div className="relative w-full bg-slate-100 overflow-auto min-h-[480px] flex items-center justify-center p-4 border-b border-slate-200">
        
        {/* Subtle Map Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />

        {/* SVG Siteplan Rendering */}
        <div 
          className="transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 820 520"
            className="w-[820px] h-[520px] rounded-xl shadow-md border border-slate-300 bg-white select-none"
          >
            {/* Campus Grounds / Landscaping */}
            <defs>
              <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#f8fafc" />
                <circle cx="10" cy="10" r="1.5" fill="#e2e8f0" />
              </pattern>
            </defs>

            {/* Base Campus Boundary */}
            <rect x="20" y="20" width="780" height="480" rx="12" fill="url(#grass)" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

            {/* Dynamic Main Road, Walkways, Flagpoles, and Trees */}
            {decorations.map((item) => {
              if (item.type === 'road_h') {
                const w = item.width || 740;
                const h = item.height || 15;
                return (
                  <g key={item.id}>
                    <rect x={item.x} y={item.y} width={w} height={h} fill="#e2e8f0" rx="4" />
                    <line x1={item.x} y1={item.y + h / 2} x2={item.x + w} y2={item.y + h / 2} stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 4" />
                  </g>
                );
              }
              if (item.type === 'road_v') {
                const w = item.width || 12;
                const h = item.height || 440;
                return (
                  <rect key={item.id} x={item.x} y={item.y} width={w} height={h} fill="#e2e8f0" rx="3" />
                );
              }
              if (item.type === 'flagpole') {
                return (
                  <g key={item.id}>
                    <circle cx={item.x} cy={item.y} r="22" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="1.5" />
                    <circle cx={item.x} cy={item.y} r="4" fill="#ef4444" />
                    <text x={item.x} y={item.y + 12} textAnchor="middle" fill="#4338ca" fontSize="8" fontWeight="bold">Tiang Bendera</text>
                  </g>
                );
              }
              if (item.type === 'tree') {
                return (
                  <g key={item.id} opacity="0.8">
                    <circle cx={item.x} cy={item.y} r="13" fill="#bbf7d0" />
                    <circle cx={item.x} cy={item.y} r="8.5" fill="#4ade80" />
                  </g>
                );
              }
              return null;
            })}

            {/* Interactive Room Shapes */}
            {rooms.map((room) => {
              const pos = room.posisi_siteplan || { x: 100, y: 100, width: 100, height: 70 };
              const isSelected = selectedRoom?.id === room.id;
              const isHovered = hoveredRoom?.id === room.id;
              const isMatch = isRoomMatching(room);
              const sarprasCount = sarprasMap[room.id] || 0;
              const baseColor = pos.color || ROOM_TYPE_COLORS[room.jenis_ruangan] || '#2563eb';

              return (
                <g
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  onMouseEnter={() => setHoveredRoom(room)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  className="cursor-pointer group transition-all duration-200"
                  style={{
                    opacity: isFiltered && !isMatch ? 0.2 : 1
                  }}
                >
                  {/* Building Shadow / Glow */}
                  <rect
                    x={pos.x + 2}
                    y={pos.y + 3}
                    width={pos.width}
                    height={pos.height}
                    rx="8"
                    fill="#0f172a"
                    opacity="0.1"
                  />

                  {/* Main Building Rect */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    height={pos.height}
                    rx="8"
                    fill={isSelected ? '#312e81' : isFiltered && isMatch ? '#e0e7ff' : isHovered ? '#f1f5f9' : '#ffffff'}
                    stroke={isSelected ? '#1e1b4b' : isFiltered && isMatch ? baseColor : isHovered ? '#4f46e5' : '#cbd5e1'}
                    strokeWidth={isSelected ? 3.5 : isFiltered && isMatch ? 3 : isHovered ? 2.5 : 1.5}
                    className="transition-all duration-200"
                  />

                  {/* Colored Header Stripe on Building */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    height={6}
                    rx="2"
                    fill={baseColor}
                  />

                  {/* Active Search/Category Highlight Outer Ring */}
                  {isFiltered && isMatch && (
                    <rect
                      x={pos.x - 4}
                      y={pos.y - 4}
                      width={pos.width + 8}
                      height={pos.height + 8}
                      rx="12"
                      fill="none"
                      stroke={baseColor}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Building Label & Code */}
                  <foreignObject
                    x={pos.x}
                    y={pos.y + 2}
                    width={pos.width}
                    height={pos.height - 2}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full p-1.5 flex flex-col justify-between items-center text-center font-sans overflow-hidden">
                      {/* Code Badge & Status */}
                      <div className="flex items-center gap-1 justify-center max-w-full">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-tighter truncate ${
                          isSelected 
                            ? 'bg-indigo-900 text-indigo-100 border border-indigo-700' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {room.kode_ruangan}
                        </span>
                        {room.status === 'Maintenance' && (
                          <span className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-400 text-amber-950 border border-amber-500 shadow-2xs" title="Dalam Maintenance">
                            🔧
                          </span>
                        )}
                        {room.status === 'Nonaktif' && (
                          <span className="px-1 py-0.2 rounded text-[7px] font-black bg-rose-400 text-rose-950 border border-rose-500 shadow-2xs" title="Ruangan Nonaktif">
                            ⛔
                          </span>
                        )}
                      </div>

                      {/* Room Name */}
                      <span className={`text-[10px] font-bold leading-tight line-clamp-2 px-0.5 ${
                        isSelected ? 'text-white' : 'text-slate-800'
                      }`}>
                        {room.nama_ruangan}
                      </span>

                      {/* Sarpras Count Pill */}
                      <span className={`px-1.5 py-0.2 text-[8px] font-semibold rounded-full ${
                        isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {sarprasCount} Barang
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredRoom && (
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 border border-slate-200 rounded-xl p-3 shadow-xl backdrop-blur-md max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-150 text-slate-900">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                {hoveredRoom.kode_ruangan}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                hoveredRoom.status === 'Maintenance'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : hoveredRoom.status === 'Nonaktif'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {hoveredRoom.status === 'Maintenance' ? '🔧 Maintenance' : hoveredRoom.status === 'Nonaktif' ? '⛔ Nonaktif' : '✅ Aktif'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Lantai {hoveredRoom.lantai}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">{hoveredRoom.nama_ruangan}</h4>
            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{hoveredRoom.deskripsi}</p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {sarprasMap[hoveredRoom.id] || 0} Sarana Prasarana
              </span>
              <span className="text-indigo-600 font-bold hover:underline">Klik detail &rarr;</span>
            </div>
          </div>
        )}

      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
        <span className="font-bold text-slate-800">Legenda Ruangan:</span>
        {Object.entries(ROOM_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded shadow-sm" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-semibold text-slate-700">{type}</span>
          </div>
        ))}
      </div>

      {/* Filtered Rooms Cards Grid Section */}
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Daftar Gedung &amp; Ruangan {filterState.selectedJenis !== 'Semua' ? `: ${filterState.selectedJenis}` : ''}
            </h3>
            <p className="text-xs text-slate-500">
              Klik pada kartu ruangan di bawah untuk membuka detail informasi dan daftar unit Sarana &amp; Prasarana.
            </p>
          </div>
          <div className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            {filteredRooms.length} Ruangan Ditemukan
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Tidak ada ruangan ditemukan</p>
            <p className="text-xs text-slate-500">Tidak ada ruangan yang sesuai dengan kriteria filter saat ini.</p>
            <button
              onClick={() => onFilterChange({ selectedJenis: 'Semua', searchQuery: '' })}
              className="mt-2 px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700"
            >
              Reset Filter &amp; Tampilkan Semua
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllRooms ? filteredRooms : filteredRooms.slice(0, 6)).map((room) => {
                const sarprasCount = sarprasMap[room.id] || 0;
                const color = ROOM_TYPE_COLORS[room.jenis_ruangan] || '#2563eb';
                const isSelected = selectedRoom?.id === room.id;

                return (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={`group bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {room.kode_ruangan}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            room.status === 'Maintenance'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : room.status === 'Nonaktif'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {room.status === 'Maintenance' ? '🔧 Maintenance' : room.status === 'Nonaktif' ? '⛔ Nonaktif' : 'Aktif'}
                          </span>
                        </div>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: color }}
                        >
                          {room.jenis_ruangan}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {room.nama_ruangan}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {room.deskripsi}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Lantai {room.lantai}</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        {sarprasCount} Sarpras
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRooms.length > 6 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowAllRooms(prev => !prev)}
                  className="px-5 py-2.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  {showAllRooms ? (
                    <>
                      <span>Tampilkan Ringkas (Top 6 Ruangan)</span>
                    </>
                  ) : (
                    <>
                      <span>Lihat Seluruh {filteredRooms.length} Ruangan &rarr;</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
