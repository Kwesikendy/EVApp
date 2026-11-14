import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArrowLeft, ArrowRight, LocateFixed, X } from 'lucide-react';

interface NavigationStation {
  id: string;
  stationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface RouteStep {
  distance: number;
  duration: number;
  name?: string;
  maneuver?: {
    type?: string;
    modifier?: string;
  };
}

interface RouteState {
  distance: number;
  duration: number;
  geometry: [number, number][];
  steps: RouteStep[];
}

export interface NavigationViewProps {
  station: NavigationStation;
  onClose: () => void;
  onNotify?: (message: string) => void;
}

function routeDistance(meters: number) {
  if (!Number.isFinite(meters)) return '0.8 km';
  if (meters < 1000) return `${Math.max(50, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function routeDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return '3 min';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

function routeInstruction(step: RouteStep) {
  const road = step.name?.trim() ? ` onto ${step.name.trim()}` : '';
  const type = step.maneuver?.type || 'continue';
  const mod = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
  if (type === 'depart') return `Start driving${road}`;
  if (type === 'arrive') return 'Arrive at Wilpower station';
  if (type === 'turn') return `Turn${mod}${road}`;
  if (type === 'roundabout') return `Enter roundabout${road}`;
  return `Continue${mod}${road}`;
}

export function NavigationView({ station, onClose }: NavigationViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const lastRoutedOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'locating' | 'ready' | 'denied' | 'unsupported'>('locating');
  const [route, setRoute] = useState<RouteState | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeNonce, setRouteNonce] = useState(0);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('ready');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [station.latitude, station.longitude],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const destinationIcon = L.divIcon({
      className: 'wp-route-destination',
      html: '<span>W</span>',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
    L.marker([station.latitude, station.longitude], { icon: destinationIcon })
      .addTo(map)
      .bindTooltip(station.name, { direction: 'top', offset: [0, -16] });
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      routeLayerRef.current = null;
    };
  }, [station]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;
    const originIcon = L.divIcon({
      className: 'wp-route-origin',
      html: '<span></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: originIcon })
        .addTo(map)
        .bindTooltip('Your location', { direction: 'top', offset: [0, -10] });
    } else {
      originMarkerRef.current.setLatLng([origin.lat, origin.lng]);
    }
  }, [origin]);

  useEffect(() => {
    if (!origin) return;
    const lastOrigin = lastRoutedOriginRef.current;
    if (
      lastOrigin &&
      Math.abs(lastOrigin.lat - origin.lat) < 0.0006 &&
      Math.abs(lastOrigin.lng - origin.lng) < 0.0006 &&
      routeNonce === 0
    ) {
      return;
    }
    const controller = new AbortController();
    setRouteLoading(true);
    setRouteError('');
    const url =
      'https://router.project-osrm.org/route/v1/driving/' +
      origin.lng +
      ',' +
      origin.lat +
      ';' +
      station.longitude +
      ',' +
      station.latitude +
      '?overview=full&geometries=geojson&steps=true';
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Route service unavailable');
        const payload = await response.json();
        const firstRoute = payload.routes?.[0];
        if (!firstRoute) throw new Error('No driving route found');
        return {
          distance: firstRoute.distance,
          duration: firstRoute.duration,
          geometry: firstRoute.geometry.coordinates,
          steps: firstRoute.legs?.[0]?.steps || [],
        } as RouteState;
      })
      .then((nextRoute) => {
        lastRoutedOriginRef.current = origin;
        setRoute(nextRoute);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setRouteError('We could not load the route. Check your connection and try again.');
        }
      })
      .finally(() => setRouteLoading(false));
    return () => controller.abort();
  }, [origin, station, routeNonce]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    routeLayerRef.current?.remove();
    const points = route.geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
    routeLayerRef.current = L.polyline(points, {
      color: '#8bbd24',
      weight: 6,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [48, 48] });
  }, [route]);

  return (
    <div className="wp-navigation-scrim" role="dialog" aria-modal="true" aria-labelledby="wp-navigation-title">
      <section className="wp-navigation-shell">
        <div className="wp-navigation-map" ref={mapContainerRef}>
          <div className="wp-navigation-toolbar">
            <button className="wp-navigation-back" onClick={onClose}>
              <ArrowLeft size={16} /> Back to stations
            </button>
            <span className="wp-status-badge">IN-APP ROUTE</span>
          </div>
          <div className="wp-navigation-map-chip">
            <span className="wp-status-dot wp-status-dot-green" /> Route preview stays inside Wilpower
          </div>
          {routeLoading && <div className="wp-navigation-map-state">Building the best route...</div>}
        </div>
        <aside className="wp-navigation-panel">
          <div className="wp-navigation-heading">
            <div>
              <span className="wp-kicker wp-kicker-lime">YOUR JOURNEY</span>
              <h2 id="wp-navigation-title">Navigate to {station.name}</h2>
              <p>{station.address}</p>
            </div>
            <button className="wp-icon-button" onClick={onClose} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>
          {route && (
            <div className="wp-navigation-stats">
              <div>
                <strong>{routeDistance(route.distance)}</strong>
                <span>driving distance</span>
              </div>
              <div>
                <strong>{routeDuration(route.duration)}</strong>
                <span>estimated time</span>
              </div>
            </div>
          )}
          {locationStatus === 'ready' && route && (
            <div className="wp-navigation-live">
              <span className="wp-status-dot wp-status-dot-green" />
              <span>Using your current location</span>
              <button onClick={() => mapRef.current?.flyTo([origin!.lat, origin!.lng], 15, { duration: 0.7 })}>
                <LocateFixed size={15} /> Recenter
              </button>
            </div>
          )}
          {(locationStatus === 'denied' || locationStatus === 'unsupported') && (
            <div className="wp-navigation-message">
              <LocateFixed size={18} />
              <div>
                <strong>Location access is needed</strong>
                <p>Allow location access to build a route from where you are now.</p>
                <button className="wp-text-button" onClick={requestLocation}>
                  Enable location <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
          {routeError && (
            <div className="wp-alert wp-alert-error">
              {routeError}{' '}
              <button className="wp-text-button" onClick={() => setRouteNonce((value) => value + 1)}>
                Try again
              </button>
            </div>
          )}
          {route && (
            <div className="wp-navigation-steps">
              <div className="wp-card-heading">
                <h3>Route steps</h3>
                <span>{route.steps.length} steps</span>
              </div>
              {route.steps.slice(0, 5).map((step, index) => (
                <div className="wp-navigation-step" key={index}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{routeInstruction(step)}</strong>
                    <small>{routeDistance(step.distance)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="wp-outline-button wp-navigation-close" onClick={onClose}>
            Return to station list
          </button>
        </aside>
      </section>
    </div>
  );
}
