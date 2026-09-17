import React, { useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Locate, Plus, Minus, Layers } from 'lucide-react-native';

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
  userLocation?: { latitude: number; longitude: number };
}

export default function StationMap({
  stations,
  selectedStation,
  onSelectStation,
  userLocation = { latitude: 5.5900, longitude: -0.1800 },
}: StationMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Generate HTML for Leaflet with CartoDB Dark Matter tiles
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
      }))
    );

    const selectedId = selectedStation ? selectedStation.id : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #020817; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    
    /* Custom High-Tech Marker */
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
      padding: 5px 9px;
      border-radius: 20px;
      background: #0b1324;
      border: 1.5px solid #38bdf8;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 12px rgba(56, 189, 248, 0.4);
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .marker-pill.selected {
      transform: scale(1.15);
      border-color: #22c55e;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 18px rgba(34, 197, 94, 0.6);
      background: #0f2744;
    }
    .marker-pill.available {
      border-color: #22c55e;
    }
    .marker-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #38bdf8;
    }
    .marker-dot.green {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
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
      background: #38bdf8;
      margin-top: -1px;
    }
    .marker-pill.selected + .marker-stem {
      background: #22c55e;
      height: 9px;
    }

    /* User Location Radar */
    .user-pulse {
      width: 22px;
      height: 22px;
      position: relative;
    }
    .user-pulse-dot {
      width: 14px;
      height: 14px;
      background: #38bdf8;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 4px;
      left: 4px;
      box-shadow: 0 0 10px #38bdf8;
    }
    .user-pulse-ring {
      width: 22px;
      height: 22px;
      border: 2px solid #38bdf8;
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

    /* Hide default Leaflet controls to keep UI clean */
    .leaflet-control-zoom { display: none !important; }
    .leaflet-control-attribution {
      background: rgba(2, 8, 23, 0.7) !important;
      color: #64748b !important;
      font-size: 8px !important;
      padding: 2px 6px !important;
    }
    .leaflet-control-attribution a { color: #38bdf8 !important; text-decoration: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const stations = ${stationsJson};
    let selectedId = '${selectedId}';
    const userLoc = [${userLocation.latitude}, ${userLocation.longitude}];

    // Initialize Map with Accra center
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([5.5850, -0.1850], 13);

    // CartoDB Dark Matter tiles (Crisp, dark, neon road contrasts, zero API key required)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OSM',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // User Vehicle Marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse"><div class="user-pulse-ring"></div><div class="user-pulse-dot"></div></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    L.marker(userLoc, { icon: userIcon, interactive: false }).addTo(map);

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
          iconSize: [80, 40],
          iconAnchor: [40, 40]
        });

        if (markers[st.id]) {
          markers[st.id].setIcon(icon);
        } else {
          const marker = L.marker([st.lat, st.lng], { icon: icon }).addTo(map);
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
        map.flyTo([st.lat, st.lng], 14, { duration: 0.8 });
      }
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SELECT_STATION',
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
          map.flyTo([5.5850, -0.1850], 13, { duration: 0.8 });
        } else if (data.type === 'FLY_TO') {
          selectedId = data.stationId;
          renderMarkers();
          map.flyTo([data.lat, data.lng], 14, { duration: 0.8 });
        }
      } catch (e) {}
    });
  </script>
</body>
</html>`;
  }, [stations, selectedStation, userLocation]);

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

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={handleMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Map Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={recenter} activeOpacity={0.8}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#020817',
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#020817',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 220,
    backgroundColor: 'rgba(11, 19, 36, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  controlBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginHorizontal: 6,
  },
});
