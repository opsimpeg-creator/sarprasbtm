import React, { useState, useRef, useEffect } from 'react';
import { Room, Sarpras, SiteplanDecorationItem, DEFAULT_DECORATION_ITEMS, loadDecorationItems, DecorationType } from '../types';
import { 
  Save, 
  LayoutGrid, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Grid, 
  RotateCcw,
  Sparkles,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Trees,
  Plus,
  Trash2,
  Compass
} from 'lucide-react';
import { saveSiteplanPositions } from '../services/apiService';

interface SiteplanEditorProps {
  rooms: Room[];
  sarpras?: Sarpras[];
  onRoomsUpdated: () => void;
}

type DraggedItem = 
  | { type: 'room'; id: string }
  | { type: 'decor'; id: string };

export const SiteplanEditor: React.FC<SiteplanEditorProps> = ({ rooms, sarpras = [], onRoomsUpdated }) => {
  const [selectedKey, setSelectedKey] = useState<string>(() => rooms[0]?.id || 'DECOR:flagpole');
  const [editedPositions, setEditedPositions] = useState<Record<string, Room['posisi_siteplan']>>(() => {
    const map: Record<string, Room['posisi_siteplan']> = {};
    rooms.forEach(r => {
      map[r.id] = r.posisi_siteplan || { x: 100, y: 100, width: 120, height: 80, color: '#2563eb' };
    });
    return map;
  });

  const [decorations, setDecorations] = useState<SiteplanDecorationItem[]>(() => loadDecorationItems());

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState<number>(1);
  const GRID_SIZE = 10;

  // Count sarpras per room
  const sarprasMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    sarpras.forEach(s => {
      map[s.room_id] = (map[s.room_id] || 0) + (s.jumlah || 1);
    });
    return map;
  }, [sarpras]);

  // Dragging State
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection references
  const isDecorSelected = selectedKey.startsWith('DECOR:');
  const activeDecorId = isDecorSelected ? selectedKey.replace('DECOR:', '') : null;
  const activeDecorItem = activeDecorId ? decorations.find(d => d.id === activeDecorId) : null;
  const activeRoom = !isDecorSelected ? rooms.find(r => r.id === selectedKey) : null;
  const activeRoomPos = activeRoom ? (editedPositions[activeRoom.id] || activeRoom.posisi_siteplan) : null;

  // Add new decoration item
  const handleAddDecoration = (type: DecorationType) => {
    const newId = `decor_${type}_${Date.now()}`;
    let newItem: SiteplanDecorationItem;

    if (type === 'road_h') {
      newItem = {
        id: newId,
        type: 'road_h',
        name: `🛣️ Jalan Horizontal (${decorations.filter(d => d.type === 'road_h').length + 1})`,
        x: 100,
        y: 200,
        width: 300,
        height: 15,
      };
    } else if (type === 'road_v') {
      newItem = {
        id: newId,
        type: 'road_v',
        name: `🚶 Jalan Vertikal (${decorations.filter(d => d.type === 'road_v').length + 1})`,
        x: 350,
        y: 50,
        width: 12,
        height: 300,
      };
    } else if (type === 'tree') {
      newItem = {
        id: newId,
        type: 'tree',
        name: `🌳 Taman / Pohon (${decorations.filter(d => d.type === 'tree').length + 1})`,
        x: 400,
        y: 150,
      };
    } else {
      newItem = {
        id: newId,
        type: 'flagpole',
        name: `🚩 Tiang Bendera (${decorations.filter(d => d.type === 'flagpole').length + 1})`,
        x: 400,
        y: 100,
      };
    }

    setDecorations(prev => [...prev, newItem]);
    setSelectedKey(`DECOR:${newId}`);
  };

  // Delete decoration item
  const handleDeleteDecoration = (id: string) => {
    setDecorations(prev => prev.filter(d => d.id !== id));
    if (rooms.length > 0) {
      setSelectedKey(rooms[0].id);
    } else {
      setSelectedKey('');
    }
  };

  // SVG Mouse/Touch coordinates helper
  const getSVGCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    pt.x = clientX;
    pt.y = clientY;
    const svgMatrix = svg.getScreenCTM()?.inverse();
    if (svgMatrix) {
      const transformed = pt.matrixTransform(svgMatrix);
      return { x: transformed.x, y: transformed.y };
    }
    return { x: 0, y: 0 };
  };

  // Start drag handler
  const handleStartDrag = (target: DraggedItem, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const key = target.type === 'room' ? target.id : `DECOR:${target.id}`;
    setSelectedKey(key);
    setDraggedItem(target);
    setIsDragging(true);

    const svgCoords = getSVGCoordinates(e);

    if (target.type === 'room') {
      const currentPos = editedPositions[target.id] || { x: 100, y: 100, width: 120, height: 80 };
      setDragOffset({
        x: svgCoords.x - currentPos.x,
        y: svgCoords.y - currentPos.y,
      });
    } else {
      const currentPos = decorations.find(d => d.id === target.id) || { x: 100, y: 100 };
      setDragOffset({
        x: svgCoords.x - currentPos.x,
        y: svgCoords.y - currentPos.y,
      });
    }
  };

  // Global pointer move & up
  useEffect(() => {
    if (!isDragging || !draggedItem) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const svgCoords = getSVGCoordinates(e);

      let newX = svgCoords.x - dragOffset.x;
      let newY = svgCoords.y - dragOffset.y;

      if (draggedItem.type === 'room') {
        const currentRoomPos = editedPositions[draggedItem.id] || { x: 100, y: 100, width: 120, height: 80 };
        const w = currentRoomPos.width || 120;
        const h = currentRoomPos.height || 80;

        newX = Math.max(0, Math.min(820 - w, newX));
        newY = Math.max(0, Math.min(520 - h, newY));

        if (snapToGrid) {
          newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
          newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }

        setEditedPositions(prev => ({
          ...prev,
          [draggedItem.id]: {
            ...prev[draggedItem.id],
            x: Math.round(newX),
            y: Math.round(newY)
          }
        }));
      } else {
        const cur = decorations.find(d => d.id === draggedItem.id);
        if (!cur) return;

        const w = cur.width || (cur.type === 'tree' || cur.type === 'flagpole' ? 30 : 20);
        const h = cur.height || (cur.type === 'tree' || cur.type === 'flagpole' ? 30 : 20);

        newX = Math.max(0, Math.min(820 - w, newX));
        newY = Math.max(0, Math.min(520 - h, newY));

        if (snapToGrid) {
          newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
          newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }

        setDecorations(prev => prev.map(d => {
          if (d.id === draggedItem.id) {
            return {
              ...d,
              x: Math.round(newX),
              y: Math.round(newY)
            };
          }
          return d;
        }));
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setDraggedItem(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, draggedItem, dragOffset, snapToGrid, editedPositions, decorations]);

  // Direction Nudge
  const nudge = (dx: number, dy: number) => {
    if (isDecorSelected && activeDecorItem) {
      let newX = Math.max(0, Math.min(800, activeDecorItem.x + dx));
      let newY = Math.max(0, Math.min(500, activeDecorItem.y + dy));
      if (snapToGrid) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      }
      setDecorations(prev => prev.map(d => d.id === activeDecorItem.id ? { ...d, x: newX, y: newY } : d));
    } else if (activeRoom && activeRoomPos) {
      const w = activeRoomPos.width || 120;
      const h = activeRoomPos.height || 80;
      let newX = Math.max(0, Math.min(820 - w, activeRoomPos.x + dx));
      let newY = Math.max(0, Math.min(520 - h, activeRoomPos.y + dy));

      if (snapToGrid) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      }

      setEditedPositions(prev => ({
        ...prev,
        [activeRoom.id]: {
          ...prev[activeRoom.id],
          x: Math.round(newX),
          y: Math.round(newY)
        }
      }));
    }
  };

  // Handle room field changes
  const handleRoomPosChange = (field: keyof Room['posisi_siteplan'], value: any) => {
    if (!activeRoom) return;
    setEditedPositions(prev => ({
      ...prev,
      [activeRoom.id]: {
        ...(prev[activeRoom.id] || { x: 100, y: 100, width: 120, height: 80 }),
        [field]: value
      }
    }));
  };

  // Handle decor field changes
  const handleDecorChange = (field: keyof SiteplanDecorationItem, value: any) => {
    if (!activeDecorItem) return;
    setDecorations(prev => prev.map(d => d.id === activeDecorItem.id ? { ...d, [field]: value } : d));
  };

  // Reset positions
  const handleResetPositions = () => {
    const map: Record<string, Room['posisi_siteplan']> = {};
    rooms.forEach(r => {
      map[r.id] = r.posisi_siteplan || { x: 100, y: 100, width: 120, height: 80, color: '#2563eb' };
    });
    setEditedPositions(map);
    setDecorations(DEFAULT_DECORATION_ITEMS);
    localStorage.setItem('smk_siteplan_decorations', JSON.stringify(DEFAULT_DECORATION_ITEMS));
    window.dispatchEvent(new Event('siteplanDecorationsUpdated'));
  };

  // Save all layout positions
  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const payload = Object.entries(editedPositions).map(([id, pos]) => ({
        id,
        posisi_siteplan: pos
      }));
      await saveSiteplanPositions(payload);

      // Save decorations
      localStorage.setItem('smk_siteplan_decorations', JSON.stringify(decorations));
      window.dispatchEvent(new Event('siteplanDecorationsUpdated'));

      setSuccessMsg('Posisi tata letak gedung, jalan, tiang bendera, & taman berhasil disimpan!');
      onRoomsUpdated();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Gagal menyimpan posisi siteplan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
      
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            Editor Siteplan Interaktif &amp; Manajemen Elemen
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Anda dapat menambah, menggeser, merubah ukuran, dan menghapus elemen jalan, tiang bendera, taman hijau, serta gedung sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetPositions}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            title="Reset ke posisi standar"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Awal</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Memproses...' : 'Simpan Siteplan'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Toolbar: Add Elements & Controls */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Quick Add Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase mr-1 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-indigo-600" /> Tambah Elemen:
            </span>
            <button
              onClick={() => handleAddDecoration('road_h')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              🛣️ <span>+ Jalan Horizontal</span>
            </button>
            <button
              onClick={() => handleAddDecoration('road_v')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              🚶 <span>+ Jalan Vertikal</span>
            </button>
            <button
              onClick={() => handleAddDecoration('tree')}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              🌳 <span>+ Taman / Pohon</span>
            </button>
            <button
              onClick={() => handleAddDecoration('flagpole')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              🚩 <span>+ Tiang Bendera</span>
            </button>
          </div>

          {/* Grid Snap & Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                snapToGrid 
                  ? 'bg-indigo-600 text-white border-indigo-700' 
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Snap Grid: {snapToGrid ? 'ON' : 'OFF'}</span>
            </button>

            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
              <button
                onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}
                className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-800">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoom !== 1 && (
                <button
                  onClick={() => setZoom(1)}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded text-[10px] font-bold"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Canvas */}
        <div className="lg:col-span-2 bg-slate-100 border border-slate-300 rounded-xl p-3 overflow-auto min-h-[480px] flex flex-col items-center justify-center relative shadow-inner">
          
          <div className="w-full flex items-center justify-between text-[11px] text-slate-700 mb-2 px-1 font-mono font-bold">
            <span className="flex items-center gap-1.5 text-indigo-900">
              <Eye className="w-4 h-4 text-indigo-600" />
              Kanvas Live Editor (820 x 520 px)
            </span>
            {isDragging && draggedItem && (
              <span className="text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                Memindahkan: {draggedItem.type === 'room' ? rooms.find(r => r.id === draggedItem.id)?.kode_ruangan : decorations.find(d => d.id === draggedItem.id)?.name}
              </span>
            )}
          </div>

          <div 
            className="transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <svg 
              ref={svgRef}
              viewBox="0 0 820 520" 
              className="w-[820px] h-[520px] bg-white rounded-xl shadow-md border border-slate-300 select-none touch-none"
            >
              <defs>
                <pattern id="editorGrass" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill="#f8fafc" />
                  <circle cx="10" cy="10" r="1.5" fill="#e2e8f0" />
                </pattern>
                {snapToGrid && (
                  <pattern id="gridOverlay" width="20" height="20" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="20" y2="0" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="0" y1="0" x2="0" y2="20" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" />
                  </pattern>
                )}
              </defs>

              {/* Base Campus Boundary */}
              <rect x="20" y="20" width="780" height="480" rx="12" fill="url(#editorGrass)" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

              {/* Grid Lines Overlay */}
              {snapToGrid && (
                <rect x="20" y="20" width="780" height="480" fill="url(#gridOverlay)" opacity="0.6" pointerEvents="none" />
              )}

              {/* Render All Decoration Items (Roads, Flagpoles, Trees) */}
              {decorations.map((item, index) => {
                const isSelected = selectedKey === `DECOR:${item.id}`;

                if (item.type === 'road_h') {
                  const w = item.width || 300;
                  const h = item.height || 15;
                  return (
                    <g
                      key={`decor-h-${item.id || 'dh'}-${index}`}
                      onMouseDown={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      onTouchStart={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {isSelected && (
                        <rect
                          x={item.x - 3}
                          y={item.y - 3}
                          width={w + 6}
                          height={h + 6}
                          rx="6"
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-pulse"
                        />
                      )}
                      <rect x={item.x} y={item.y} width={w} height={h} fill="#e2e8f0" rx="4" />
                      <line x1={item.x} y1={item.y + h / 2} x2={item.x + w} y2={item.y + h / 2} stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 4" />
                    </g>
                  );
                }

                if (item.type === 'road_v') {
                  const w = item.width || 12;
                  const h = item.height || 300;
                  return (
                    <g
                      key={`decor-v-${item.id || 'dv'}-${index}`}
                      onMouseDown={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      onTouchStart={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {isSelected && (
                        <rect
                          x={item.x - 3}
                          y={item.y - 3}
                          width={w + 6}
                          height={h + 6}
                          rx="5"
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-pulse"
                        />
                      )}
                      <rect x={item.x} y={item.y} width={w} height={h} fill="#e2e8f0" rx="3" />
                    </g>
                  );
                }

                if (item.type === 'flagpole') {
                  return (
                    <g
                      key={`decor-flag-${item.id || 'fl'}-${index}`}
                      onMouseDown={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      onTouchStart={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {isSelected && (
                        <circle
                          cx={item.x}
                          cy={item.y}
                          r="26"
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-pulse"
                        />
                      )}
                      <circle cx={item.x} cy={item.y} r="22" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="1.5" />
                      <circle cx={item.x} cy={item.y} r="4" fill="#ef4444" />
                      <text x={item.x} y={item.y + 12} textAnchor="middle" fill="#4338ca" fontSize="8" fontWeight="bold">Tiang Bendera</text>
                    </g>
                  );
                }

                if (item.type === 'tree') {
                  return (
                    <g
                      key={`decor-tree-${item.id || 'tr'}-${index}`}
                      onMouseDown={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      onTouchStart={(e) => handleStartDrag({ type: 'decor', id: item.id }, e)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {isSelected && (
                        <circle
                          cx={item.x}
                          cy={item.y}
                          r="18"
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="2.5"
                          strokeDasharray="3 2"
                          className="animate-pulse"
                        />
                      )}
                      <circle cx={item.x} cy={item.y} r="13" fill="#bbf7d0" />
                      <circle cx={item.x} cy={item.y} r="8.5" fill="#4ade80" />
                    </g>
                  );
                }

                return null;
              })}

              {/* Render Room Buildings */}
              {rooms.map((room, index) => {
                const pos = editedPositions[room.id] || room.posisi_siteplan || { x: 100, y: 100, width: 120, height: 80 };
                const isSelected = selectedKey === room.id;
                const isBeingDragged = draggedItem?.type === 'room' && draggedItem.id === room.id;
                const sCount = sarprasMap[room.id] || 0;
                const baseColor = pos.color || '#2563eb';

                return (
                  <g
                    key={`editor-room-${room.id || 'r'}-${index}`}
                    onMouseDown={(e) => handleStartDrag({ type: 'room', id: room.id }, e)}
                    onTouchStart={(e) => handleStartDrag({ type: 'room', id: room.id }, e)}
                    className="cursor-grab active:cursor-grabbing transition-transform"
                  >
                    {isSelected && (
                      <rect
                        x={pos.x - 4}
                        y={pos.y - 4}
                        width={pos.width + 8}
                        height={pos.height + 8}
                        rx="12"
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-pulse"
                      />
                    )}

                    <rect
                      x={pos.x + 2}
                      y={pos.y + 3}
                      width={pos.width}
                      height={pos.height}
                      rx="8"
                      fill="#0f172a"
                      opacity="0.1"
                    />

                    <rect
                      x={pos.x}
                      y={pos.y}
                      width={pos.width}
                      height={pos.height}
                      rx="8"
                      fill={isBeingDragged ? '#fef3c7' : isSelected ? '#e0e7ff' : '#ffffff'}
                      stroke={isBeingDragged ? '#f59e0b' : isSelected ? '#4338ca' : '#cbd5e1'}
                      strokeWidth={isBeingDragged ? 3 : isSelected ? 2.5 : 1.5}
                    />

                    <rect
                      x={pos.x}
                      y={pos.y}
                      width={pos.width}
                      height={6}
                      rx="2"
                      fill={baseColor}
                    />

                    <foreignObject
                      x={pos.x}
                      y={pos.y + 2}
                      width={pos.width}
                      height={pos.height - 2}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full p-1.5 flex flex-col justify-between items-center text-center font-sans overflow-hidden">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-tighter truncate max-w-full ${
                          isSelected 
                            ? 'bg-indigo-900 text-indigo-100 border border-indigo-700' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {room.kode_ruangan}
                        </span>

                        <span className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2 px-0.5">
                          {room.nama_ruangan}
                        </span>

                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 text-[8px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {sCount} Barang
                          </span>
                          <span className="text-[7px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded border border-indigo-200">
                            ({pos.x},{pos.y})
                          </span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>

        </div>

        {/* Right Inspector & Fine Control Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Elemen / Gedung Terpilih:
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 shadow-sm"
            >
              <optgroup label="🏛️ Gedung & Ruangan Sekolah">
                {rooms.map((r, index) => (
                  <option key={`opt-room-${r.id || 'r'}-${index}`} value={r.id}>
                    {r.kode_ruangan} - {r.nama_ruangan}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🛣️ Jalan, Tiang Bendera, & Taman">
                {decorations.map((d, index) => (
                  <option key={`opt-decor-${d.id || 'd'}-${index}`} value={`DECOR:${d.id}`}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* INSPECTOR PANEL FOR DECORATION */}
          {isDecorSelected && activeDecorItem ? (
            <div className="space-y-4 pt-3 border-t border-slate-200 text-xs">
              <div className="p-3 bg-white border border-emerald-200 rounded-lg shadow-sm flex items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Trees className="w-4 h-4 text-emerald-600" />
                    {activeDecorItem.name}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Fasilitas / Elemen Tambahan</div>
                </div>

                <button
                  onClick={() => handleDeleteDecoration(activeDecorItem.id)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  title="Hapus Elemen Ini"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              </div>

              {/* Name Label Edit */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nama / Label Elemen</label>
                <input
                  type="text"
                  value={activeDecorItem.name}
                  onChange={(e) => handleDecorChange('name', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold text-xs shadow-sm"
                />
              </div>

              {/* Directional Nudge Buttons */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 text-center">
                  Navigasi Geser (Nudge 10px):
                </label>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudge(0, -10)}
                    className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-700 border border-slate-300 rounded-md transition-colors"
                    title="Geser Atas"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => nudge(-10, 0)}
                      className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-700 border border-slate-300 rounded-md transition-colors"
                      title="Geser Kiri"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono px-2">
                      X:{activeDecorItem.x}, Y:{activeDecorItem.y}
                    </span>
                    <button
                      type="button"
                      onClick={() => nudge(10, 0)}
                      className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-700 border border-slate-300 rounded-md transition-colors"
                      title="Geser Kanan"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => nudge(0, 10)}
                    className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-700 border border-slate-300 rounded-md transition-colors"
                    title="Geser Bawah"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Precise Numerical Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Posisi X (px)</label>
                  <input
                    type="number"
                    value={activeDecorItem.x}
                    onChange={(e) => handleDecorChange('x', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Posisi Y (px)</label>
                  <input
                    type="number"
                    value={activeDecorItem.y}
                    onChange={(e) => handleDecorChange('y', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>

                {(activeDecorItem.type === 'road_h' || activeDecorItem.type === 'road_v') && (
                  <>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Lebar W (px)</label>
                      <input
                        type="number"
                        value={activeDecorItem.width || (activeDecorItem.type === 'road_h' ? 300 : 12)}
                        onChange={(e) => handleDecorChange('width', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Tinggi H (px)</label>
                      <input
                        type="number"
                        value={activeDecorItem.height || (activeDecorItem.type === 'road_h' ? 15 : 300)}
                        onChange={(e) => handleDecorChange('height', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-1.5 border border-slate-200">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Setelah menambah / merubah elemen, klik <strong>Simpan Siteplan</strong> di atas.</span>
              </div>
            </div>
          ) : activeRoom && activeRoomPos ? (
            /* INSPECTOR PANEL FOR ROOM */
            <div className="space-y-4 pt-3 border-t border-slate-200 text-xs">
              
              <div className="p-3 bg-white border border-indigo-200 rounded-lg shadow-sm">
                <div className="font-extrabold text-slate-900 text-sm">{activeRoom.nama_ruangan}</div>
                <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">Kode: {activeRoom.kode_ruangan} | {activeRoom.jenis_ruangan}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 text-center">
                  Navigasi Geser (Nudge 10px):
                </label>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudge(0, -10)}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-700 border border-slate-300 rounded-md transition-colors"
                    title="Geser Atas"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => nudge(-10, 0)}
                      className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-700 border border-slate-300 rounded-md transition-colors"
                      title="Geser Kiri"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono px-2">
                      X:{activeRoomPos.x}, Y:{activeRoomPos.y}
                    </span>
                    <button
                      type="button"
                      onClick={() => nudge(10, 0)}
                      className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-700 border border-slate-300 rounded-md transition-colors"
                      title="Geser Kanan"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => nudge(0, 10)}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-700 border border-slate-300 rounded-md transition-colors"
                    title="Geser Bawah"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Posisi X (px)</label>
                  <input
                    type="number"
                    value={activeRoomPos.x}
                    onChange={(e) => handleRoomPosChange('x', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Posisi Y (px)</label>
                  <input
                    type="number"
                    value={activeRoomPos.y}
                    onChange={(e) => handleRoomPosChange('y', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Lebar W (px)</label>
                  <input
                    type="number"
                    value={activeRoomPos.width}
                    onChange={(e) => handleRoomPosChange('width', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tinggi H (px)</label>
                  <input
                    type="number"
                    value={activeRoomPos.height}
                    onChange={(e) => handleRoomPosChange('height', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Warna Gedung</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeRoomPos.color || '#2563eb'}
                    onChange={(e) => handleRoomPosChange('color', e.target.value)}
                    className="w-12 h-9 bg-white border border-slate-300 rounded cursor-pointer p-0.5 shadow-sm"
                  />
                  <input
                    type="text"
                    value={activeRoomPos.color || '#2563eb'}
                    onChange={(e) => handleRoomPosChange('color', e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold shadow-sm"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-1.5 border border-slate-200">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Setelah selesai memindahkan posisi, klik <strong>Simpan Siteplan</strong> di atas.</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              Pilih elemen atau ruangan dari dropdown di atas untuk mulai mengatur koordinat.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
