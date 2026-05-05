import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import axiosInstance from '../../api/axiosInstance';

// ── Fix Leaflet's default icon path issue with Vite ──────────────────────────
// react-leaflet + Vite breaks the default marker icons. We use custom divIcons
// (emoji-based) instead, which sidesteps the issue entirely.

const makeIcon = (emoji, size = 36) =>
  L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">${emoji}</div>`,
    className: '',
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

const WAREHOUSE_ICON  = makeIcon('🏭', 38);
const SUPPLIER_ICON   = makeIcon('📦', 32);
const ACTIVE_ICON     = makeIcon('🚚', 34); // supplier with active orders

// Warehouse location — Sharjah, UAE (centre between the two suppliers)
const WAREHOUSE = {
  name: 'SmartStock Warehouse',
  position: [25.3463, 55.4209],
};

// ── Auto-fit map bounds to all markers ───────────────────────────────────────
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 1) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [points, map]);
  return null;
}

// ── Main SuppliersMap component ───────────────────────────────────────────────
function SuppliersMap() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      toast.error('Failed to load supplier map data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  // All map points (for auto-fit)
  const allPoints = [
    WAREHOUSE.position,
    ...suppliers.filter(s => s.latitude && s.longitude).map(s => [s.latitude, s.longitude]),
  ];

  const mappedSuppliers = suppliers.filter(s => s.latitude && s.longitude);
  const unmappedSuppliers = suppliers.filter(s => !s.latitude || !s.longitude);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Suppliers Map</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Geographic view of all suppliers and delivery routes to the warehouse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={e => setShowRoutes(e.target.checked)}
              className="rounded"
            />
            Show delivery routes
          </label>
          <button onClick={fetchSuppliers} className="text-sm text-indigo-600 hover:underline">↻ Refresh</button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-indigo-700">{suppliers.length}</p>
          <p className="text-xs text-gray-500">Total Suppliers</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-green-700">{mappedSuppliers.length}</p>
          <p className="text-xs text-gray-500">Mapped Locations</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-orange-700">
            {suppliers.reduce((sum, s) => sum + (s.active_requests || 0), 0)}
          </p>
          <p className="text-xs text-gray-500">Active Orders</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96 bg-gray-50 rounded-xl border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-500">Loading map...</span>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '460px' }}>
          <MapContainer
            center={WAREHOUSE.position}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            {/* OpenStreetMap tiles — 100% free, no API key */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Auto-fit bounds */}
            <FitBounds points={allPoints} />

            {/* Warehouse marker */}
            <Marker position={WAREHOUSE.position} icon={WAREHOUSE_ICON}>
              <Popup>
                <div className="text-sm font-semibold text-gray-800 mb-1">🏭 {WAREHOUSE.name}</div>
                <p className="text-xs text-gray-500">This is where all deliveries are received</p>
              </Popup>
            </Marker>

            {/* Supplier markers + delivery route lines */}
            {mappedSuppliers.map(supplier => {
              const pos     = [supplier.latitude, supplier.longitude];
              const hasActive = supplier.active_requests > 0;
              const icon    = hasActive ? ACTIVE_ICON : SUPPLIER_ICON;

              return (
                <React.Fragment key={supplier.id}>
                  <Marker position={pos} icon={icon}>
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <p className="font-bold text-gray-800 text-sm mb-1">{supplier.name}</p>
                        {supplier.contact_email && (
                          <p className="text-xs text-gray-500 mb-2">✉ {supplier.contact_email}</p>
                        )}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          hasActive
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {hasActive ? `🚚 ${supplier.active_requests} active order${supplier.active_requests > 1 ? 's' : ''}` : '✓ No active orders'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Dashed delivery route line to warehouse */}
                  {showRoutes && (
                    <Polyline
                      positions={[pos, WAREHOUSE.position]}
                      pathOptions={{
                        color: hasActive ? '#f97316' : '#94a3b8',
                        weight: hasActive ? 2.5 : 1.5,
                        dashArray: hasActive ? '8 4' : '4 6',
                        opacity: hasActive ? 0.85 : 0.4,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="text-base">🏭</span> SmartStock Warehouse</span>
        <span className="flex items-center gap-1.5"><span className="text-base">📦</span> Supplier (no active orders)</span>
        <span className="flex items-center gap-1.5"><span className="text-base">🚚</span> Supplier (has active orders)</span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: 'inline-block', width: 24, height: 3, background: '#f97316', borderRadius: 2 }}></span>
          Active delivery route
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: 'inline-block', width: 24, height: 2, background: '#94a3b8', borderRadius: 2 }}></span>
          Inactive route
        </span>
      </div>

      {/* Unmapped suppliers warning */}
      {unmappedSuppliers.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 text-sm text-yellow-700">
          ⚠️ {unmappedSuppliers.length} supplier{unmappedSuppliers.length > 1 ? 's' : ''} not shown on map (no coordinates):&nbsp;
          <strong>{unmappedSuppliers.map(s => s.name).join(', ')}</strong>
        </div>
      )}
    </div>
  );
}

export default SuppliersMap;
