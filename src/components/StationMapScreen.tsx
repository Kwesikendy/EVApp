import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  SlidersHorizontal,
  Navigation,
  Locate,
  Zap,
  Clock,
  Compass,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Layers
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
  connectors: { type: string; count: number; maxKw: number }[];
  amenities: string[];
}

const ACCRA_STATIONS: WebStation[] = [
  {
    id: 'airport-superhub',
    stationId: 'XC-ACC-01',
    name: 'XCharge Superhub - Airport City',
    subline: 'Liberation Rd, Airport Residential Area',
    address: 'Liberation Rd, Opposite Marina Mall, Accra',
    power: 'Up to 350 kW Ultra-Fast',
    maxKw: 350,
    availableStalls: 4,
    totalStalls: 6,
    distance: '1.8 km',
    eta: '4 min',
    tariffPerKwh: 3.20,
    lat: 5.6037,
    lng: -0.1870,
    connectors: [
      { type: 'CCS2', count: 4, maxKw: 350 },
      { type: 'CHAdeMO', count: 2, maxKw: 100 },
    ],
    amenities: ['Coffee Lounge', 'Free Wi-Fi', 'Security 24/7', 'EV Detailing'],
  },
  {
    id: 'spintex-corridor',
    stationId: 'XC-ACC-02',
    name: 'XCharge Express - Spintex Road',
    subline: 'Kasapreko Junction, Spintex Industrial',
    address: 'Spintex Rd, Near Palace Mall, Accra',
    power: 'Up to 240 kW DC Fast',
    maxKw: 240,
    availableStalls: 3,
    totalStalls: 4,
    distance: '4.2 km',
    eta: '8 min',
    tariffPerKwh: 3.10,
    lat: 5.6321,
    lng: -0.1142,
    connectors: [
      { type: 'CCS2', count: 3, maxKw: 240 },
      { type: 'Type 2', count: 1, maxKw: 22 },
    ],
    amenities: ['Convenience Store', 'Restrooms', 'Security 24/7'],
  },
  {
    id: 'east-legon-hub',
    stationId: 'XC-ACC-03',
    name: 'XCharge Hub - East Legon',
    subline: 'Lagos Avenue, Near American House',
    address: 'Lagos Ave, East Legon, Accra',
    power: 'Up to 180 kW High-Speed',
    maxKw: 180,
    availableStalls: 2,
    totalStalls: 4,
    distance: '5.1 km',
    eta: '12 min',
    tariffPerKwh: 2.95,
    lat: 5.6420,
    lng: -0.1550,
    connectors: [
      { type: 'CCS2', count: 2, maxKw: 180 },
      { type: 'GB/T', count: 2, maxKw: 80 },
    ],
    amenities: ['Café', 'Wi-Fi', 'Shopping'],
  },
  {
    id: 'financial-plaza',
    stationId: 'XC-ACC-04',
    name: 'XCharge Central - Financial Plaza',
    subline: 'Independence Ave, Ridge Commercial Hub',
    address: 'Ridge Towers, Independence Ave, Accra',
    power: 'Up to 300 kW Ultra-Fast',
    maxKw: 300,
    availableStalls: 5,
    totalStalls: 6,
    distance: '3.6 km',
    eta: '9 min',
    tariffPerKwh: 3.30,
    lat: 5.5560,
    lng: -0.1920,
    connectors: [
      { type: 'CCS2', count: 4, maxKw: 300 },
      { type: 'CHAdeMO', count: 2, maxKw: 120 },
    ],
    amenities: ['Executive Lounge', 'ATM', 'Valet Parking'],
  },
  {
    id: 'tema-harbour',
    stationId: 'XC-ACC-05',
    name: 'XCharge Heavy Depot - Tema Harbour',
    subline: 'Port Access Expressway, Industrial Zone',
    address: 'Berth 11 Corridor, Tema Port',
    power: 'Up to 160 kW Commercial Fleet',
    maxKw: 160,
    availableStalls: 1,
    totalStalls: 2,
    distance: '14.8 km',
    eta: '22 min',
    tariffPerKwh: 2.65,
    lat: 5.6698,
    lng: -0.0166,
    connectors: [
      { type: 'CCS2', count: 2, maxKw: 160 },
    ],
    amenities: ['Heavy Duty Bay', 'Driver Rest Area'],
  },
];

// Helper to calculate distance in kilometers using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
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
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Live User Location & Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'locating' | 'granted' | 'denied'>('locating');

  const [selectedStationId, setSelectedStationId] = useState<string>('airport-superhub');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ultra' | 'available'>('available');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRoute, setActiveRoute] = useState<boolean>(true);

  // Dynamic Station distances & ETAs based on user's live coordinates
  const computedStations = React.useMemo(() => {
    return ACCRA_STATIONS.map((st) => {
      if (!userLocation) {
        return {
          ...st,
          rawDistanceKm: parseFloat(st.distance) || 2.0,
        };
      }

      const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, st.lat, st.lng);
      const distanceStr = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
      // Average city driving speed ~35 km/h in Accra traffic
      const etaMins = Math.max(1, Math.round((distKm / 35) * 60));
      const etaStr = `${etaMins} min`;

      return {
        ...st,
        distance: distanceStr,
        eta: etaStr,
        rawDistanceKm: distKm,
      };
    });
  }, [userLocation]);

  const selectedStation = computedStations.find((s) => s.id === selectedStationId) || computedStations[0];

  // Request & Watch Live Location immediately on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('locating');

    // Continuous watch for high-accuracy live driver coordinates
    const geoId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };

        setUserLocation((prev) => {
          // If first time receiving position and map is ready, immediately center map on driver!
          if (!prev && mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
          }
          return newLoc;
        });
        setLocationStatus('granted');
      },
      (error) => {
        console.warn('Geolocation unavailable or denied:', error.message);
        setLocationStatus((prev) => (prev === 'granted' ? prev : 'denied'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(geoId);
    };
  }, []);

  // Initialize Real Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initial center: if user location already resolved, use it; else fallback to central Accra
    const initialCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [5.6037, -0.1870];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Sleek Dark Matter Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // User GPS pulsing dot
    const userGpsIcon = L.divIcon({
      className: 'user-pulse-marker',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #00f0ff; opacity: 0.4; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #00f0ff; border: 2.5px solid #ffffff; box-shadow: 0 0 12px #00f0ff;"></div>
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

  // Sync Markers & Availability
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    computedStations.forEach((st) => {
      const isSelected = st.id === selectedStationId;
      const isAvailable = st.availableStalls > 0;
      const badgeColor = isAvailable ? '#00f0ff' : '#ff4d4d';

      const customIcon = L.divIcon({
        className: 'station-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: #10141a;
            border: 1.5px solid ${isSelected ? '#00f0ff' : 'rgba(255,255,255,0.15)'};
            padding: 4px 8px;
            border-radius: 20px;
            box-shadow: 0 4px 20px ${isSelected ? 'rgba(0,240,255,0.45)' : 'rgba(0,0,0,0.7)'};
            transform: scale(${isSelected ? '1.1' : '1'});
            transition: all 0.2s ease;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${badgeColor};
              box-shadow: 0 0 6px ${badgeColor};
            "></span>
            <span style="
              font-size: 11px;
              font-weight: 700;
              font-family: sans-serif;
              color: ${isSelected ? '#00f0ff' : '#ffffff'};
            ">${st.maxKw} kW · ${st.availableStalls} open</span>
          </div>
        `,
        iconSize: [110, 30],
        iconAnchor: [55, 15],
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedStationId(st.id);
        map.flyTo([st.lat, st.lng], 14, { duration: 0.8 });
      });

      markersRef.current[st.id] = marker;
    });
  }, [computedStations, selectedStationId]);

  // Draw Neon Route from User Location to Selected Station
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (activeRoute && selectedStation) {
      const userLoc: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [5.6037, -0.1870];
      const targetLoc: [number, number] = [selectedStation.lat, selectedStation.lng];

      // Waypoint midpoint curve for aesthetic arc
      const midPoint: [number, number] = [
        (userLoc[0] + targetLoc[0]) / 2 + 0.002,
        (userLoc[1] + targetLoc[1]) / 2 - 0.002,
      ];

      const polyline = L.polyline([userLoc, midPoint, targetLoc], {
        color: '#00f0ff',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      routePolylineRef.current = polyline;
    }
  }, [selectedStation, activeRoute, userLocation]);

  const filteredStations = computedStations.filter((s) => {
    if (activeFilter === 'ultra') return s.maxKw >= 200;
    if (activeFilter === 'available') return s.availableStalls > 0;
    return true;
  });

  // Recenter map on user's live position or prompt for permission
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
          if (mapRef.current) {
            mapRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 0.8 });
          }
        },
        () => {
          setLocationStatus('denied');
          if (mapRef.current) {
            mapRef.current.flyTo([5.6037, -0.1870], 14, { duration: 0.8 });
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Launch Google Maps Turn-by-Turn Navigation
  const handleOpenGoogleMaps = (station: WebStation) => {
    const destLat = station.lat;
    const destLng = station.lng;
    
    // Google Maps universal turn-by-turn navigation URL
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    if (userLocation) {
      url += `&origin=${userLocation.lat},${userLocation.lng}`;
    }

    // Opens native Google Maps app on iOS/Android or browser tab with full directions
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-[#0a0e14] overflow-hidden select-none">
      {/* 1. Real Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full bg-[#0a0e14]" />

      {/* 2. Floating Top Search & Filter Toolbar */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md z-20 flex flex-col gap-2 pointer-events-none">
        {/* Search Input Card */}
        <div className="bg-[#10141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xl pointer-events-auto">
          <Search className="w-4 h-4 text-[#00f0ff] shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search Accra ultra-fast chargers & hubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-[#64748b] focus:outline-none font-medium"
          />

          {/* Live GPS Status Indicator */}
          <div className="shrink-0 flex items-center">
            {locationStatus === 'locating' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00f0ff]/10 text-[10px] font-mono text-[#00f0ff]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
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
                title="Location Disabled · Tap to Enable"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="hidden xs:inline">GPS Off</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setActiveRoute(!activeRoute)}
            className={`p-1.5 rounded-xl border transition-all ${
              activeRoute ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff]' : 'bg-[#181c22] border-white/10 text-slate-400'
            }`}
            title="Toggle Live Route"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
          {[
            { id: 'available', label: 'Available Now' },
            { id: 'ultra', label: 'Ultra-Fast 200kW+' },
            { id: 'all', label: 'All Hubs' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all shrink-0 border ${
                activeFilter === f.id
                  ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-sm'
                  : 'bg-[#10141a]/85 backdrop-blur-md text-[#94a3b8] border-white/10 hover:border-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Floating Right Quick Action Floating Buttons */}
      <div className="absolute right-3 top-28 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-9 h-9 rounded-xl bg-[#10141a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-[#181c22] hover:border-[#00f0ff]/50 active:scale-95 transition-all cursor-pointer"
          title="Recenter to My Location"
        >
          <Locate className="w-4 h-4 text-[#00f0ff]" />
        </button>
        <button
          onClick={() => {
            if (mapRef.current) {
              const currentZoom = mapRef.current.getZoom();
              mapRef.current.setZoom(currentZoom + 1);
            }
          }}
          className="w-9 h-9 rounded-xl bg-[#10141a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-[#181c22] active:scale-95 transition-all text-base font-bold cursor-pointer"
        >
          +
        </button>
        <button
          onClick={() => {
            if (mapRef.current) {
              const currentZoom = mapRef.current.getZoom();
              mapRef.current.setZoom(currentZoom - 1);
            }
          }}
          className="w-9 h-9 rounded-xl bg-[#10141a]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-[#181c22] active:scale-95 transition-all text-base font-bold cursor-pointer"
        >
          −
        </button>
      </div>

      {/* 4. Sleek Bottom Station Preview Card (Fixed height, perfectly contained) */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md z-20">
        <div className="bg-[#10141a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">
                  {selectedStation.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00e676]/15 text-[#00e676] text-[10px] font-bold border border-[#00e676]/30 shrink-0">
                  {selectedStation.availableStalls} of {selectedStation.totalStalls} Open
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                {selectedStation.subline} · <span className="text-[#00f0ff] font-semibold">{selectedStation.distance} ({selectedStation.eta})</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-bold text-[#00f0ff]">
                GH₵ {selectedStation.tariffPerKwh.toFixed(2)}
              </div>
              <div className="text-[9px] text-[#64748b] font-medium uppercase tracking-wider">
                per kWh
              </div>
            </div>
          </div>

          {/* Connectors & Power Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {selectedStation.connectors.map((c, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#181c22] border border-white/5 flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3 h-3 text-[#00f0ff]" />
                <span className="text-[11px] font-semibold text-slate-200">
                  {c.type} ({c.count} avail)
                </span>
                <span className="text-[9px] text-[#94a3b8] font-mono">
                  {c.maxKw}kW
                </span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              id="btn-station-navigate-google"
              onClick={() => handleOpenGoogleMaps(selectedStation)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#181c22] hover:bg-[#20252e] border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer group"
              title="Open Google Maps Turn-by-Turn Navigation"
            >
              <Navigation className="w-3.5 h-3.5 text-[#00f0ff] group-hover:rotate-45 transition-transform" />
              <span>Navigate ({selectedStation.eta})</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToCharge) onNavigateToCharge();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#00f0ff] hover:bg-[#00d2ff] text-black text-xs font-extrabold transition-all shadow-md shadow-black/40 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Plug & Charge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
