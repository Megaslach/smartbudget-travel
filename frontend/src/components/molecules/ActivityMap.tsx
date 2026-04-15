'use client';

import { useEffect, useRef } from 'react';
import type { ItineraryDay, ItineraryActivity } from '@/types';

const categoryColors: Record<string, string> = {
  sight: '#6366f1',
  food: '#f97316',
  activity: '#8b5cf6',
  nature: '#10b981',
  shopping: '#ec4899',
  nightlife: '#a855f7',
  transport: '#64748b',
};

const categoryEmoji: Record<string, string> = {
  sight: '🏛️', food: '🍽️', activity: '🎯', nature: '🌿',
  shopping: '🛍️', nightlife: '🌙', transport: '🚕',
};

interface ActivityMapProps {
  days: ItineraryDay[];
  activeDay?: number;
  height?: number;
}

export default function ActivityMap({ days, activeDay, height = 360 }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (cancelled || !mapRef.current) return;

      const allActivities: Array<{ a: ItineraryActivity; dayIdx: number }> = [];
      days.forEach((d, dayIdx) => {
        d.activities.forEach((a) => {
          if (a.lat && a.lng) allActivities.push({ a, dayIdx });
        });
      });

      const visible = typeof activeDay === 'number'
        ? allActivities.filter((x) => x.dayIdx === activeDay)
        : allActivities;

      if (visible.length === 0) return;

      const centerLat = visible.reduce((s, x) => s + x.a.lat, 0) / visible.length;
      const centerLng = visible.reduce((s, x) => s + x.a.lng, 0) / visible.length;

      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: 13,
          scrollWheelZoom: false,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(leafletMapRef.current);
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add markers
      visible.forEach(({ a }, i) => {
        const color = categoryColors[a.category || 'activity'] || '#6366f1';
        const emoji = categoryEmoji[a.category || 'activity'] || '📍';

        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${color};width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">${emoji}</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        const marker = L.marker([a.lat, a.lng], { icon }).addTo(leafletMapRef.current);
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="font-weight:700;font-size:14px;color:#111;margin-bottom:4px">${a.title}</div>
            <div style="color:#666;font-size:12px;margin-bottom:6px">${a.location}</div>
            <div style="display:flex;gap:8px;font-size:11px">
              <span style="color:${color};font-weight:600">${a.time}</span>
              <span style="color:#999">• ${a.duration}</span>
              ${a.estimatedCost ? `<span style="color:#999">• ${a.estimatedCost}€</span>` : ''}
            </div>
          </div>
        `);
        if (i === 0 && typeof activeDay === 'number') marker.openPopup();
        markersRef.current.push(marker);
      });

      // Fit bounds to visible markers
      if (visible.length > 1) {
        const bounds = L.latLngBounds(visible.map(({ a }) => [a.lat, a.lng] as [number, number]));
        leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
      } else {
        leafletMapRef.current.setView([visible[0].a.lat, visible[0].a.lng], 14);
      }
    })();

    return () => { cancelled = true; };
  }, [days, activeDay]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-gray-100" />;
}
