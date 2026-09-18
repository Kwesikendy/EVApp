import React, { useRef, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Locate, Plus, Minus, Layers, Compass } from 'lucide-react-native';

export interface MapStationConnector {
  id: number;
  connectorId: number;
  type: string;
  maxPowerKw: number;
  status: string;
  tariffPerKwh: number;
}

export interface MapStation {
  id: string;
  stationId: string;
  name: string;
  address: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  connectors: MapStationConnector[];
  amenities: string[];
}

interface StationMapProps {
  stations: MapStation[];
  selectedStation: MapStation | null;
  onSelectStation: (station: MapStation) => void;
  onStartCharge?: (station: MapStation) => void;
  userLocation?: { latitude: number; longitude: number };
}

export default function StationMap({
  stations,
  selectedStation,
  onSelectStation,
  onStartCharge,
  userLocation = { latitude: 5.5900, longitude: -0.1800 },
}: StationMapProps) {
  const webViewRef = useRef<any>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<'osm' | 'dark'>('osm');

  // Generate HTML for OpenStreetMap with Leaflet
  const htmlContent = useMemo(() => {
    const stationsJson = JSON.stringify(
      stations.map((s) => ({
        id: s.id,
        stationId: s.stationId,
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        maxPower: Math.max(...s.connectors.map((c) => c.maxPowerKw), 50),
        hasAvailable: s.connectors.some((c) => c.status === 'Available'),
        availableCount: s.connectors.filter((c) => c.status === 'Available').length,
        totalConnectors: s.connectors.length,
        address: s.address,
        distanceKm: s.distanceKm,
        tariff: s.connectors[0]?.tariffPerKwh || 4.20,
      }))
    );

    const selectedId = selectedStation ? selectedStation.id : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  
  <!-- Leaflet stylesheet from multi-CDN with fallback -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0f172a; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    
    /* Custom EV Station Marker */
    .ev-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transform: translate(-50%, -100%);
    }
    .marker-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 20px;
      background: #0b1324;
      border: 2px solid #0284c7;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 10px rgba(14, 165, 233, 0.3);
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .marker-pill.selected {
      transform: scale(1.15);
      border-color: #10b981;
      background: #064e3b;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7), 0 0 16px rgba(16, 185, 129, 0.6);
    }
    .marker-pill.available {
      border-color: #10b981;
    }
    .marker-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0284c7;
    }
    .marker-dot.green {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }
    .marker-kw {
      font-size: 11px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: 0.3px;
    }
    .marker-stem {
      width: 2px;
      height: 7px;
      background: #0284c7;
      margin-top: -1px;
    }
    .marker-pill.selected + .marker-stem {
      background: #10b981;
      height: 9px;
    }

    /* User Vehicle Location Radar */
    .user-pulse {
      width: 26px;
      height: 26px;
      position: relative;
    }
    .user-pulse-dot {
      width: 14px;
      height: 14px;
      background: #0284c7;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 6px;
      left: 6px;
      box-shadow: 0 0 10px #0284c7;
    }
    .user-pulse-ring {
      width: 26px;
      height: 26px;
      border: 2.5px solid #0284c7;
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
      animation: pulseAnim 2s infinite cubic-bezier(0.25, 1, 0.5, 1);
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* Custom Leaflet Popup Styling */
    .leaflet-popup-content-wrapper {
      background: #0f172a !important;
      color: #f8fafc !important;
      border-radius: 14px !important;
      border: 1px solid #1e293b !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8) !important;
      padding: 0 !important;
      overflow: hidden;
    }
    .leaflet-popup-content {
      margin: 0 !important;
      line-height: 1.4 !important;
      width: 220px !important;
    }
    .leaflet-popup-tip {
      background: #0f172a !important;
    }
    .station-popup {
      padding: 12px 14px;
    }
    .station-popup-title {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 2px;
    }
    .station-popup-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .station-popup-badge-row {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
    }
    .station-popup-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      background: #1e293b;
      color: #38bdf8;
    }
    .station-popup-badge.avail {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .station-popup-btn {
      display: block;
      width: 100%;
      padding: 7px 0;
      background: #0284c7;
      color: #ffffff;
      text-align: center;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;
    }
    .station-popup-btn:active {
      background: #0369a1;
    }

    /* Attribution & Zoom controls */
    .leaflet-control-zoom { display: none !important; }
    .leaflet-control-attribution {
      background: rgba(15, 23, 42, 0.8) !important;
      color: #64748b !important;
      font-size: 9px !important;
      padding: 2px 6px !important;
    }
    .leaflet-control-attribution a { color: #38bdf8 !important; text-decoration: none; }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- Multi-CDN Leaflet script loader -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    if (typeof L === 'undefined') {
      document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"><\\/script>');
    }
  </script>

  <script>
    const stations = ${stationsJson};
    let selectedId = '${selectedId}';
    const userLoc = [${userLocation.latitude}, ${userLocation.longitude}];
    let currentTileMode = '${currentMapStyle}';

    // Initialize Map with Accra center
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19,
      minZoom: 10
    }).setView([5.5900, -0.1800], 13);

    // OpenStreetMap Standard Tiles (Actual open-source map with all roads and labels)
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    });

    // CartoDB Dark Matter Tiles (Night Mode)
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OSM',
      subdomains: 'abcd',
      maxZoom: 19
    });

    if (currentTileMode === 'dark') {
      darkLayer.addTo(map);
    } else {
      osmLayer.addTo(map);
    }

    let activeLayer = currentTileMode === 'dark' ? darkLayer : osmLayer;

    // User Vehicle Marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse"><div class="user-pulse-ring"></div><div class="user-pulse-dot"></div></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    const userMarker = L.marker(userLoc, { icon: userIcon, interactive: false }).addTo(map);

    // Station Markers
    const markers = {};

    function renderMarkers() {
      stations.forEach(st => {
        const isSel = st.id === selectedId;
        const dotColorClass = st.hasAvailable ? 'green' : '';
        const pillClass = 'marker-pill ' + (isSel ? 'selected' : '') + ' ' + (st.hasAvailable ? 'available' : '');

        const iconHtml = \`
          <div class="ev-marker" onclick="handleStationClick('\${st.id}')">
            <div class="\${pillClass}">
              <div class="marker-dot \${dotColorClass}"></div>
              <span class="marker-kw">\${st.maxPower} kW</span>
            </div>
            <div class="marker-stem"></div>
          </div>
        \`;

        const icon = L.divIcon({
          className: '',
          html: iconHtml,
          iconSize: [84, 42],
          iconAnchor: [42, 42]
        });

        const popupHtml = \`
          <div class="station-popup">
            <div class="station-popup-title">\${st.name}</div>
            <div class="station-popup-sub">\${st.address} · \${st.distanceKm} km</div>
            <div class="station-popup-badge-row">
              <span class="station-popup-badge avail">\${st.availableCount}/\${st.totalConnectors} Available</span>
              <span class="station-popup-badge">\${st.maxPower} kW CCS2</span>
              <span class="station-popup-badge">GH₵ \${st.tariff.toFixed(2)}/kWh</span>
            </div>
            <div class="station-popup-btn" onclick="handleChargeClick('\${st.id}')">
              ⚡ Connect & Charge
            </div>
          </div>
        \`;

        if (markers[st.id]) {
          markers[st.id].setIcon(icon);
        } else {
          const marker = L.marker([st.lat, st.lng], { icon: icon }).addTo(map);
          marker.bindPopup(popupHtml, { offset: [0, -38], closeButton: false });
          marker.on('click', () => handleStationClick(st.id));
          markers[st.id] = marker;
        }
      });
    }

    renderMarkers();

    function handleStationClick(id) {
      selectedId = id;
      renderMarkers();
      const st = stations.find(s => s.id === id);
      if (st) {
        map.flyTo([st.lat, st.lng], 14, { duration: 0.6 });
        if (markers[id]) {
          markers[id].openPopup();
        }
      }
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SELECT_STATION',
          stationId: id
        }));
      }
    }

    function handleChargeClick(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'START_CHARGE',
          stationId: id
        }));
      }
    }

    // Message handler from React Native
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ZOOM_IN') {
          map.zoomIn();
        } else if (data.type === 'ZOOM_OUT') {
          map.zoomOut();
        } else if (data.type === 'RECENTER') {
          map.flyTo(userLoc, 14, { duration: 0.6 });
        } else if (data.type === 'FLY_TO') {
          selectedId = data.stationId;
          renderMarkers();
          map.flyTo([data.lat, data.lng], 15, { duration: 0.6 });
          if (markers[data.stationId]) {
            markers[data.stationId].openPopup();
          }
        } else if (data.type === 'TOGGLE_LAYER') {
          map.removeLayer(activeLayer);
          if (data.style === 'dark') {
            activeLayer = darkLayer;
          } else {
            activeLayer = osmLayer;
          }
          activeLayer.addTo(map);
        }
      } catch (_e) {}
    });

    // Also listen to document for Android WebView compatibility
    document.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ZOOM_IN') map.zoomIn();
        else if (data.type === 'ZOOM_OUT') map.zoomOut();
        else if (data.type === 'RECENTER') map.flyTo(userLoc, 14, { duration: 0.6 });
        else if (data.type === 'TOGGLE_LAYER') {
          map.removeLayer(activeLayer);
          activeLayer = data.style === 'dark' ? darkLayer : osmLayer;
          activeLayer.addTo(map);
        }
      } catch (_e) {}
    });
  </script>
</body>
</html>`;
  }, [stations, selectedStation, userLocation, currentMapStyle]);

  // Fly to selected station if changed from parent
  useEffect(() => {
    if (selectedStation && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'FLY_TO',
          stationId: selectedStation.id,
          lat: selectedStation.latitude,
          lng: selectedStation.longitude,
        })
      );
    }
  }, [selectedStation]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_STATION') {
        const found = stations.find((s) => s.id === data.stationId);
        if (found) {
          onSelectStation(found);
        }
      } else if (data.type === 'START_CHARGE') {
        const found = stations.find((s) => s.id === data.stationId);
        if (found) {
          onSelectStation(found);
          if (onStartCharge) {
            onStartCharge(found);
          }
        }
      }
    } catch (_err) {
      // ignore
    }
  };

  const zoomIn = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'ZOOM_IN' }));
  };

  const zoomOut = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'ZOOM_OUT' }));
  };

  const recenter = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'RECENTER' }));
  };

  const toggleLayer = () => {
    const nextStyle = currentMapStyle === 'osm' ? 'dark' : 'osm';
    setCurrentMapStyle(nextStyle);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'TOGGLE_LAYER', style: nextStyle }));
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://localhost' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        androidLayerType="hardware"
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={handleMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Map Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={toggleLayer}
          activeOpacity={0.8}
          accessibilityLabel="Toggle Map Style"
        >
          <Layers size={18} color={currentMapStyle === 'osm' ? '#38bdf8' : '#a855f7'} />
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={recenter}
          activeOpacity={0.8}
          accessibilityLabel="Recenter Map"
        >
          <Locate size={18} color="#38bdf8" />
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <TouchableOpacity style={styles.controlBtn} onPress={zoomIn} activeOpacity={0.8}>
          <Plus size={18} color="#f8fafc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={zoomOut} activeOpacity={0.8}>
          <Minus size={18} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* Map Layer Tag */}
      <View style={styles.mapLayerBadge}>
        <Compass size={11} color="#38bdf8" />
        <Text style={styles.mapLayerBadgeText}>
          {currentMapStyle === 'osm' ? 'OpenStreetMap (Streets)' : 'Dark Ops Mode'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 220,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 25,
  },
  controlBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 6,
  },
  mapLayerBadge: {
    position: 'absolute',
    top: 58,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 20,
  },
  mapLayerBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
});
