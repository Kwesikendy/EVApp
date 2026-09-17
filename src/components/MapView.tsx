import React, { useEffect, useRef } from 'react';
import type { ChargingStation, Connector } from '../types';
import L from 'leaflet';
import { Navigation, Clock, ShieldCheck, DollarSign } from 'lucide-react';

interface MapViewProps {
  stations: ChargingStation[];
  selectedStation: ChargingStation | null;
  onSelectStation: (station: ChargingStation) => void;
  activeRouteStationId: string | null;
  onToggleRoute: (stationId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  activeRouteStationId,
  onToggleRoute
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // User simulated GPS location (Accra Central / Airport corridor)
  const userLocation: [number, number] = [5.5900, -0.1850];

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: userLocation,
      zoom: 13,
      zoomControl: false,
    });

    // Dark sleek map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // User Location Pulse Marker
    const userIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-sky-500 rounded-full animate-ping opacity-60"></div>
          <div class="w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(userLocation, { icon: userIcon })
      .addTo(map)
      .bindTooltip('Your Current EV Location', { permanent: false, direction: 'top' });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean old markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => marker.remove());
    markersRef.current = {};

    stations.forEach(station => {
      const availableCount = station.connectors.filter(c => c.status === 'Available').length;
      const totalCount = station.connectors.length;
      const maxPower = Math.max(...station.connectors.map(c => c.maxPowerKw));
      const isSelected = selectedStation?.id === station.id;

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-110 z-50' : 'hover:scale-105'}">
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-md border ${
            availableCount > 0
              ? 'bg-slate-900 border-emerald-500/80 text-emerald-400'
              : 'bg-slate-900 border-rose-500/80 text-rose-400'
          }">
            <div class="w-2.5 h-2.5 rounded-full ${
              availableCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }"></div>
            <span class="text-xs font-bold font-mono tracking-tight">${maxPower}kW</span>
            <span class="text-[10px] bg-slate-800 text-slate-300 px-1 rounded font-semibold">${availableCount}/${totalCount}</span>
          </div>
          <div class="w-2 h-2 bg-slate-900 border-r border-b ${
            availableCount > 0 ? 'border-emerald-500/80' : 'border-rose-500/80'
          } rotate-45 mx-auto -mt-1"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: `xcharge-station-marker-${station.id}`,
        html: markerHtml,
        iconSize: [85, 36],
        iconAnchor: [42, 36],
      });

      const marker = L.marker([station.latitude, station.longitude], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          onSelectStation(station);
        });

      markersRef.current[station.id] = marker;
    });
  }, [stations, selectedStation]);

  // Route Polyline Drawing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (activeRouteStationId) {
      const targetStation = stations.find(s => s.id === activeRouteStationId || s.stationId === activeRouteStationId);
      if (targetStation) {
        // Simple synthetic street navigation points
        const midPoint: [number, number] = [
          (userLocation[0] + targetStation.latitude) / 2 + 0.003,
          (userLocation[1] + targetStation.longitude) / 2 - 0.002
        ];
        const routePoints: [number, number][] = [
          userLocation,
          midPoint,
          [targetStation.latitude, targetStation.longitude]
        ];

        const polyline = L.polyline(routePoints, {
          color: '#0ea5e9',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        routePolylineRef.current = polyline;
      }
    }
  }, [activeRouteStationId, stations]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] z-0" />

      {/* Top Map HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap gap-2 justify-between items-center">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-semibold text-slate-200">XCharge Grid Live</span>
          <span className="text-[11px] text-slate-400">| 4 Hubs • 11 Connectors</span>
        </div>

        {activeRouteStationId && (
          <div className="pointer-events-auto bg-sky-950/95 border border-sky-500/50 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 text-sky-300 text-xs">
            <Navigation className="w-3.5 h-3.5 animate-bounce" />
            <span className="font-semibold">Turn-by-Turn Route Active</span>
            <button
              id="btn-cancel-route"
              onClick={() => onToggleRoute(activeRouteStationId)}
              className="ml-2 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Quick Filter Bar */}
      <div className="absolute bottom-4 left-3 right-3 z-10 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Connector Filter:</span>
          <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 px-2 py-0.5 rounded-full font-mono font-medium">CCS2 (Ultra-Fast)</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">CHAdeMO</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Type 2</span>
        </div>
      </div>
    </div>
  );
};
