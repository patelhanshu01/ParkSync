import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface EmbeddedNavigationProps {
  destination: {
    lat?: number;
    lng?: number;
    name: string;
    address?: string;
  };
  height?: number;
}

const EmbeddedNavigation: React.FC<EmbeddedNavigationProps> = ({ destination, height = 260 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [resolvedDest, setResolvedDest] = useState<{ lat: number; lng: number } | null>(
    destination.lat !== undefined && destination.lng !== undefined
      ? { lat: destination.lat, lng: destination.lng }
      : null
  );
  const [hasScript, setHasScript] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      setError('Maps key missing');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    loader
      .load()
      .then(() => setHasScript(true))
      .catch(() => setError('Failed to load Maps'));
  }, []);

  // Geocode if no lat/lng provided
  useEffect(() => {
    if (!hasScript || resolvedDest || !destination.address) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: destination.address }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        setResolvedDest({ lat: loc.lat(), lng: loc.lng() });
      } else {
        setError('Could not resolve destination');
      }
    });
  }, [hasScript, resolvedDest, destination.address]);

  // Init map when script and destination ready
  useEffect(() => {
    if (!hasScript || !resolvedDest || !mapRef.current) return;

    const newMap = new google.maps.Map(mapRef.current, {
      zoom: 15,
      center: resolvedDest,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const renderer = new google.maps.DirectionsRenderer({
      map: newMap,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5
      }
    });
    rendererRef.current = renderer;

    // Add destination marker
    new google.maps.Marker({
      position: resolvedDest,
      map: newMap,
      title: destination.name
    });

    // Get user location and show route
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        const service = new google.maps.DirectionsService();
        service.route(
          {
            origin: userLoc,
            destination: resolvedDest as google.maps.LatLngLiteral,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
          },
          (result, status) => {
            if (status === 'OK' && result) {
              renderer.setDirections(result);
            } else {
              setError('Directions request failed');
            }
          }
        );
      },
      () => {
        // If location not available, at least center on destination
        newMap.setCenter(resolvedDest);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => {
      rendererRef.current?.setMap(null);
    };
  }, [hasScript, resolvedDest, destination.name]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }} />
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        background: 'rgba(255,255,255,0.9)',
        padding: '10px 12px',
        borderRadius: 10,
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1f2937' }}>Navigating to {destination.name}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Follow the highlighted route</div>
        </div>
        {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
};

export default EmbeddedNavigation;
