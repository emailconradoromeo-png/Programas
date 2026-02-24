'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import type { ListingSearchResult } from '@/types/listing';

// Fix default marker icons for Leaflet in bundled environments
import 'leaflet/dist/leaflet.css';

// Custom default icon
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: 'selected-marker',
});

interface MapViewProps {
  results: ListingSearchResult[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
}

// Component to recenter map when results change
function MapBoundsUpdater({ results }: { results: ListingSearchResult[] }) {
  const map = useMap();

  useEffect(() => {
    if (results.length === 0) return;

    const bounds = L.latLngBounds(
      results
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => [r.latitude!, r.longitude!] as [number, number])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [results, map]);

  return null;
}

const operationLabels: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  alquiler_vacacional: 'Vacacional',
};

export default function MapView({
  results,
  selectedId,
  onMarkerClick,
}: MapViewProps) {
  const { locale } = useParams<{ locale: string }>();

  // Default center: Malabo, Equatorial Guinea
  const defaultCenter: [number, number] = [3.75, 8.78];
  const defaultZoom = 9;

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="text-center text-sm text-gray-500">
          <p className="font-medium">No hay propiedades con ubicacion</p>
          <p className="mt-1 text-xs">
            Las propiedades con coordenadas apareceran aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater results={results} />

      {results.map((result) => {
        if (result.latitude == null || result.longitude == null) return null;
        const isSelected = result.id === selectedId;

        return (
          <Marker
            key={result.id}
            position={[result.latitude, result.longitude]}
            icon={isSelected ? selectedIcon : defaultIcon}
            eventHandlers={{
              click: () => onMarkerClick?.(result.id),
            }}
          >
            <Popup maxWidth={280} minWidth={220}>
              <div className="p-1">
                {/* Image */}
                {result.primary_image_url && (
                  <div className="mb-2 overflow-hidden rounded">
                    <img
                      src={result.primary_image_url}
                      alt={result.title}
                      className="h-28 w-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <p className="text-sm font-bold text-blue-600">
                  {formatCurrency(result.price, result.currency)}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {result.title}
                </p>
                <p className="text-xs text-gray-500">
                  {result.city}
                  {result.operation_type && (
                    <span className="ml-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                      {operationLabels[result.operation_type] || result.operation_type}
                    </span>
                  )}
                </p>

                {/* Features */}
                <div className="mt-1.5 flex gap-3 text-xs text-gray-500">
                  {result.bedrooms != null && (
                    <span>{result.bedrooms} hab.</span>
                  )}
                  {result.bathrooms != null && (
                    <span>{result.bathrooms} bano(s)</span>
                  )}
                  {result.area_m2 > 0 && (
                    <span>{result.area_m2} m&sup2;</span>
                  )}
                </div>

                {/* Link */}
                <Link
                  href={`/${locale}/properties/${result.id}`}
                  className="mt-2 block rounded bg-blue-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-700"
                >
                  Ver detalles
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
