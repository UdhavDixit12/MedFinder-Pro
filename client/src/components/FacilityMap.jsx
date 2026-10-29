import { useEffect, useMemo, useRef } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { categoryMeta, displayName, formatDistance } from '../utils/facility.js';

const TILE_URL = import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const iconCache = new Map();
function markerIcon(category, selected) {
  const key = `${category}:${selected}`;
  if (!iconCache.has(key)) {
    const meta = categoryMeta(category);
    iconCache.set(
      key,
      L.divIcon({
        className: `mf-marker${selected ? ' is-selected' : ''}`,
        html: `<div class="pin" style="background:${meta.color}"><span>${meta.letter}</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26],
      }),
    );
  }
  return iconCache.get(key);
}

const originIcon = L.divIcon({ className: 'mf-marker', html: '<div class="mf-origin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

function MapController({ origin, radius, viewKey, selected, markerRefs, visible }) {
  const map = useMap();

  useEffect(() => {
    if (!origin) return;
    const bounds = L.latLng(origin.lat, origin.lon).toBounds(radius * 2);
    map.fitBounds(bounds, { padding: [16, 16], animate: false });
  }, [map, viewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    const target = [selected.lat, selected.lon];
    map.setView(target, Math.max(map.getZoom(), 15), { animate: true });
    const marker = markerRefs.current[selected.id];
    if (marker) setTimeout(() => marker.openPopup(), 250);
  }, [map, selected, markerRefs]);

  useEffect(() => {
    if (visible) setTimeout(() => map.invalidateSize(), 50);
  }, [map, visible]);

  return null;
}

export default function FacilityMap({ facilities, selectedId, onSelect, onOpenDetails, origin, radius, viewKey, visible = true, className }) {
  const markerRefs = useRef({});
  const selected = useMemo(() => facilities.find((f) => f.id === selectedId) || null, [facilities, selectedId]);
  const center = origin ? [origin.lat, origin.lon] : [28.7931703, 76.1391283];

  return (
    <div className={className} role="region" aria-label="Map of search results">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full" attributionControl>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        {origin && (
          <>
            <Circle
              center={[origin.lat, origin.lon]}
              radius={radius}
              pathOptions={{ color: '#2554eb', weight: 1.5, fillColor: '#2554eb', fillOpacity: 0.04, dashArray: '4 6' }}
            />
            <Marker position={[origin.lat, origin.lon]} icon={originIcon} keyboard={false} zIndexOffset={-100}>
              <Tooltip direction="top" offset={[0, -8]}>
                Search location
              </Tooltip>
            </Marker>
          </>
        )}
        {facilities.map((f) => {
          const isSelected = f.id === selectedId;
          const name = displayName(f);
          return (
            <Marker
              key={f.id}
              position={[f.lat, f.lon]}
              icon={markerIcon(f.category, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              title={name}
              alt={`${name} (${categoryMeta(f.category).label})`}
              ref={(instance) => {
                if (instance) markerRefs.current[f.id] = instance;
                else delete markerRefs.current[f.id];
              }}
              eventHandlers={{ click: () => onSelect?.(f.id) }}
            >
              <Popup>
                <div className="min-w-44 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-600">
                    {f.categoryLabel}
                    {f.distanceMeters != null && ` · ${formatDistance(f.distanceMeters)}`}
                  </p>
                  {onOpenDetails && (
                    <button
                      type="button"
                      onClick={() => onOpenDetails(f.id)}
                      className="mt-1 text-xs font-semibold text-brand-700 underline hover:text-brand-800"
                    >
                      View details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        <MapController
          origin={origin}
          radius={radius}
          viewKey={viewKey}
          selected={selected}
          markerRefs={markerRefs}
          visible={visible}
        />
      </MapContainer>
    </div>
  );
}
