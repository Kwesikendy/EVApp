import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Navigation,
  Locate,
  Zap,
  Clock,
  Construction,
  ChevronRight,
  Layers,
  MapPin,
} from 'lucide-react';

export interface WebStation {
  id: string;
  stationId: string;
  name: string;
  subline: string;
  address: string;
  power: string;
  maxKw: number;
  availableStalls: number;
  totalStalls: number;
  distance: string;
  eta: string;
  tariffPerKwh: number;
  lat: number;
  lng: number;
  isOnline: boolean;
  constructionStatus?: 'under_construction' | 'planned' | null;
  hardware?: string;
  protocol?: string;
  connectors: { type: string; count: number; maxKw: number; label?: string }[];
  amenities: string[];
}

// ChargeLink GH — Real Station Registry
// Station 1: Greenwood Event Center, Kumasi, Ashanti (under construction)
const CHARGELINK_STATIONS: WebStation[] = [
  {
    id: 'greenwood-kumasi',
    stationId: 'CL-KSI-001',
    name: 'Greenwood Event Center',
    subline: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass',
    address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi, Ashanti',
    power: '160 kW DC Fast',
    maxKw: 160,
    availableStalls: 0,
    totalStalls: 2,
    distance: '—',
    eta: '—',
    tariffPerKwh: 4.50,
    lat: 6.6697479,
    lng: -1.5995679,
    isOnline: false,
    constructionStatus: 'under_construction',
    hardware: 'MaxPower VCP160',
    protocol: 'OCPP 1.6J',
    connectors: [
      { type: 'GB/T', count: 1, maxKw: 160, label: 'Gun A' },
      { type: 'CCS2', count: 1, maxKw: 160, label: 'Gun B' },
    ],
    amenities: ['Event Center', 'Parking Bay', 'Security 24/7', '24hr Operation', 'Opoku Bandoh Plaza'],
  },
];

// Helper to calculate distance in kilometers using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface StationMapScreenProps {
  onNavigateToCharge?: () => void;
}

export const StationMapScreen: React.FC<StationMapScreenProps> = ({ onNavigateToCharge }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Live User Location & Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'locating' | 'granted' | 'denied'>('locating');

  const [selectedStationId, setSelectedStationId] = useState<string>('greenwood-kumasi');

  // Dynamic Station distances & ETAs based on user's live coordinates
  const computedStations = React.useMemo(() => {
    return CHARGELINK_STATIONS.map((st) => {
      if (!userLocation) {
        return { ...st, rawDistanceKm: 0 };
      }
      const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, st.lat, st.lng);
      const distanceStr = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
      // Kumasi driving avg ~30 km/h
      const etaMins = Math.max(1, Math.round((distKm / 30) * 60));
      return {
        ...st,
        distance: distanceStr,
        eta: `${etaMins} min`,
        rawDistanceKm: distKm,
      };
    });
  }, [userLocation]);

  const selectedStation = computedStations.find((s) => s.id === selectedStationId) || computedStations[0];

  // Request & Watch Live Location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    const geoId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setUserLocation((prev) => {
          if (!prev && mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
          }
          return newLoc;
        });
        setLocationStatus('granted');
      },
      (error) => {
        console.warn('Geolocation unavailable:', error.message);
        setLocationStatus((prev) => (prev === 'granted' ? prev : 'denied'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
    return () => { navigator.geolocation.clearWatch(geoId); };
  }, []);

  // Initialize Leaflet Map — centered on Kumasi / Greenwood Event Center
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [6.6697479, -1.5995679]; // Greenwood Event Center, Kumasi

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // User GPS pulsing dot — ChargeLink Green
    const userGpsIcon = L.divIcon({
      className: 'user-pulse-marker',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #22c55e; opacity: 0.35; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #22c55e; border: 2.5px solid #ffffff; box-shadow: 0 0 12px #22c55e;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker(initialCenter, { icon: userGpsIcon }).addTo(map);
    userMarkerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Keep User Marker synced with live GPS
  useEffect(() => {
    if (!userLocation || !userMarkerRef.current) return;
    userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
  }, [userLocation]);

  // Sync Station Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    computedStations.forEach((st) => {
      const isSelected = st.id === selectedStationId;
      const isConstruction = st.constructionStatus === 'under_construction';

      // Amber for under-construction, green for operational, red for offline
      const pillColor = isConstruction ? '#f59e0b' : st.isOnline ? '#22c55e' : '#ff4d4d';

      const customIcon = L.divIcon({
        className: 'station-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: #10141a;
            border: 1.5px solid ${isSelected ? pillColor : 'rgba(255,255,255,0.12)'};
            padding: 5px 10px;
            border-radius: 20px;
            box-shadow: 0 4px 20px ${isSelected ? `rgba(${isConstruction ? '245,158,11' : '34,197,94'},0.45)` : 'rgba(0,0,0,0.7)'};
            transform: scale(${isSelected ? '1.12' : '1'});
            transition: all 0.2s ease;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="
              width: 8px; height: 8px; border-radius: 50%;
              background: ${pillColor};
              box-shadow: 0 0 6px ${pillColor};
            "></span>
            <span style="
              font-size: 11px; font-weight: 700; font-family: sans-serif;
              color: ${isSelected ? pillColor : '#ffffff'};
            ">${isConstruction ? '🔧 Coming Soon' : `${st.maxKw} kW · ${st.availableStalls} open`}</span>
          </div>
        `,
        iconSize: [160, 30],
        iconAnchor: [80, 15],
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedStationId(st.id);
        map.flyTo([st.lat, st.lng], 15, { duration: 0.8 });
      });
      markersRef.current[st.id] = marker;
    });
  }, [computedStations, selectedStationId]);

  // Recenter handler
  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 0.8 });
    } else if (navigator.geolocation) {
      setLocationStatus('locating');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationStatus('granted');
          mapRef.current?.flyTo([loc.lat, loc.lng], 15, { duration: 0.8 });
        },
        () => {
          setLocationStatus('denied');
          // Fall back to Greenwood Event Center
          mapRef.current?.flyTo([6.6697479, -1.5995679], 15, { duration: 0.8 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Google Maps Navigation
  const handleOpenGoogleMaps = (station: WebStation) => {
    let url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&travelmode=driving`;
    if (userLocation) url += `&origin=${userLocation.lat},${userLocation.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isConstruction = selectedStation?.constructionStatus === 'under_construction';

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-[#0a0e14] overflow-hidden select-none">
      {/* 1. Real Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full bg-[#0a0e14]" />

      {/* 2. Floating Top Search & GPS Toolbar */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md z-20 flex flex-col gap-2 pointer-events-none">
        {/* Search Input Card */}
        <div className="bg-[#10141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xl pointer-events-auto">
          <Search className="w-4 h-4 text-[#22c55e] shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Greenwood Event Center, Kumasi..."
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-[#64748b] focus:outline-none font-medium"
            readOnly
          />

          {/* Live GPS Status */}
          <div className="shrink-0 flex items-center">
            {locationStatus === 'locating' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[10px] font-mono text-[#22c55e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
                <span className="hidden xs:inline">Locating...</span>
              </span>
            )}
            {locationStatus === 'granted' && (
              <button
                type="button"
                onClick={handleRecenter}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00e676]/10 text-[10px] font-mono text-[#00e676] hover:bg-[#00e676]/20 transition-colors cursor-pointer"
                title="GPS Active · Tap to Recenter"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                <span className="hidden xs:inline">Live GPS</span>
              </button>
            )}
            {locationStatus === 'denied' && (
              <button
                type="button"
                onClick={handleRecenter}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-mono text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Location Disabled"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="hidden xs:inline">GPS Off</span>
              </button>
            )}
          </div>
        </div>

        {/* Under Construction Banner */}
        {isConstruction && (
          <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2 pointer-events-auto">
            <span className="text-amber-400 text-sm">🔧</span>
            <div>
              <p className="text-[11px] font-bold text-amber-300">Station Under Construction</p>
              <p className="text-[10px] text-amber-400/70">MaxPower VCP160 charger en route — launching soon!</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating Right Controls */}
      <div className="absolute right-3 top-28 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-9 h-9 rounded-xl bg-[#10141a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-[#181c22] hover:border-[#22c55e]/50 active:scale-95 transition-all cursor-pointer"
          title="Recenter to My Location"
        >
          <Locate className="w-4 h-4 text-[#22c55e]" />
        </button>
        <button
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 14) + 1)}
          className="w-9 h-9 rounded-xl bg-[#10141a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-[#181c22] active:scale-95 transition-all text-base font-bold cursor-pointer"
        >+</button>
        <button
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 14) - 1)}
          className="w-9 h-9 rounded-xl bg-[#10141a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-[#181c22] active:scale-95 transition-all text-base font-bold cursor-pointer"
        >−</button>
      </div>

      {/* 4. Bottom Station Card */}
      {selectedStation && (
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md z-20">
          <div className={`bg-[#10141a]/95 backdrop-blur-2xl border rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3 ${isConstruction ? 'border-amber-500/30' : 'border-white/10'}`}>
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white tracking-tight truncate">
                    {selectedStation.name}
                  </h3>
                  {isConstruction ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30 shrink-0">
                      Under Construction
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] text-[10px] font-bold border border-[#22c55e]/30 shrink-0">
                      {selectedStation.availableStalls} of {selectedStation.totalStalls} Open
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                  {selectedStation.subline}
                  {userLocation && selectedStation.rawDistanceKm
                    ? <> · <span className="text-[#22c55e] font-semibold">{selectedStation.distance} ({selectedStation.eta})</span></>
                    : null}
                </p>
                {selectedStation.hardware && (
                  <p className="text-[10px] text-[#64748b] mt-0.5 font-mono">
                    {selectedStation.hardware} · {selectedStation.protocol} · Dynamic Sharing
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-[#22c55e]">
                  GH₵ {selectedStation.tariffPerKwh.toFixed(2)}
                </div>
                <div className="text-[9px] text-[#64748b] font-medium uppercase tracking-wider">
                  per kWh
                </div>
              </div>
            </div>

            {/* Connectors */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {selectedStation.connectors.map((c, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#181c22] border border-white/5 flex items-center gap-1.5 shrink-0"
                >
                  <Zap className="w-3 h-3 text-[#22c55e]" />
                  <span className="text-[11px] font-semibold text-slate-200">
                    {c.label ? `${c.label} · ` : ''}{c.type}
                  </span>
                  <span className="text-[9px] text-[#94a3b8] font-mono">
                    {c.maxKw}kW
                  </span>
                </div>
              ))}
            </div>

            {/* Idle Fee Note */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>5-min grace · GH₵ 0.50/min idle · Max GH₵ 10.00</span>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                id="btn-station-navigate-google"
                onClick={() => handleOpenGoogleMaps(selectedStation)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#181c22] hover:bg-[#20252e] border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer group"
                title="Open Google Maps Navigation"
              >
                <Navigation className="w-3.5 h-3.5 text-[#22c55e] group-hover:rotate-45 transition-transform" />
                <span>Navigate</span>
              </button>

              {isConstruction ? (
                <button
                  disabled
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                >
                  <span>🔧</span>
                  <span>Coming Soon</span>
                </button>
              ) : (
                <button
                  onClick={() => { if (onNavigateToCharge) onNavigateToCharge(); }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-extrabold transition-all shadow-md shadow-black/40 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Plug &amp; Charge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
