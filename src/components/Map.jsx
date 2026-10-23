import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getImageUrl } from '../utils/images';

// Fix for default Leaflet icon issue in Webpack/Vite bundlers
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to dynamically adjust map bounds/center on updates
const MapController = ({ listings }) => {
  const map = useMap();

  useEffect(() => {
    if (!listings || listings.length === 0) return;

    if (listings.length === 1) {
      map.setView(listings[0].position, 15);
    } else {
      const bounds = L.latLngBounds(listings.map((item) => item.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [listings, map]);

  return null;
};

const Map = ({ listings = [], currency, language }) => {
  const isRtl = language?.startsWith('ar');

  const toLatLng = (listing) => {
    const coordinates =
      listing?.position || listing?.coordinates || listing?.location?.coordinates;

    if (Array.isArray(coordinates)) {
      const lat = Number(coordinates[0]);
      const lng = Number(coordinates[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
    }

    const lat = Number(coordinates?.lat);
    const lng = Number(coordinates?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  };

  const normalizedListings = useMemo(() => {
    return listings
      .map((listing) => ({
        ...listing,
        position: toLatLng(listing),
      }))
      .filter((listing) => listing.position);
  }, [listings]);

  const mapCenter = useMemo(() => {
    return normalizedListings.length === 1
      ? normalizedListings[0].position
      : [34.032, -6.822]; // Default to Rabat/Morocco
  }, [normalizedListings]);

  const formatLocation = (location) => {
    if (!location) return '';
    if (typeof location === 'object') {
      return location.city || location.address || '';
    }
    return location;
  };

  const formatPrice = (priceVal) => {
    const numericPrice = Number(priceVal) || 0;
    if (Number.isNaN(numericPrice)) return '';

    const formattedPrice = numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const displaySymbol =
      language === 'en' && currency?.code === 'MAD'
        ? 'MAD'
        : currency?.symbol ?? 'MAD';

    return `${formattedPrice} ${displaySymbol}`;
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={normalizedListings.length === 1 ? 15 : 12}
      style={{
        height: '100%',
        width: '100%',
        zIndex: 1,
      }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController listings={normalizedListings} />

      {normalizedListings.map((listing) => {
        const itemPrice = listing.price ?? listing.pricePerNight;

        return (
          <Marker key={listing.id ?? listing._id} position={listing.position}>
            <Popup>
              <div
                className={`flex flex-col w-45 font-sans ${
                  isRtl ? 'text-right' : 'text-left'
                }`}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <div className="h-24 w-full overflow-hidden rounded-lg mb-2 bg-gray-100">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={
                      getImageUrl(listing.image || listing.images?.[0]) ||
                      '/placeholder.jpg'
                    }
                    alt={listing.titleEn || listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-bold text-[14px] text-gray-900 leading-tight mb-1 truncate">
                  {isRtl ? listing.title : listing.titleEn || listing.title}
                </h4>
                <p className="text-gray-500 text-[12px] mb-1 truncate">
                  {isRtl
                    ? formatLocation(listing.location)
                    : listing.locationEn || formatLocation(listing.location)}
                </p>
                <p className="text-[#2DB4A0] font-bold text-[14px]">
                  {formatPrice(itemPrice)}
                  <span className="text-gray-600 font-light text-[11px]">
                    {' '}
                    / {isRtl ? 'ليلة' : 'night'}
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default React.memo(Map);