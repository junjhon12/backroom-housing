import { useEffect, useRef, type FC } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LevelMap.css';
import {
  LEVELS,
  PIN_COLORS,
  ROUTE,
  UNCHARTED,
  WORLD_BOUNDS,
  type LevelRegion,
  type Placement,
} from '../lib/levelMap';

interface LevelMapProps {
  placements: readonly Placement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const boundsOf = (area: LevelRegion): L.LatLngBoundsExpression => [
  [area.y, area.x],
  [area.y + area.h, area.x + area.w],
];

const centreOf = (area: LevelRegion): L.LatLngTuple => [area.y + area.h / 2, area.x + area.w / 2];

const pinIcon = (placement: Placement, selected: boolean): L.DivIcon =>
  L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div class="level-pin level-pin--${placement.property.hazardClass}${
      selected ? ' level-pin--selected' : ''
    }" style="background-color:${PIN_COLORS[placement.property.hazardClass]}"></div>`,
  });

/**
 * The registry's survey chart. Leaflet runs on a flat CRS rather than map
 * tiles: each level is a rectangle, units are pins, and dashed lines mark the
 * stairwells between levels. The map is imperative, so React owns only the
 * container and the effects below keep Leaflet in step with props.
 */
const LevelMap: FC<LevelMapProps> = ({ placements, selectedId, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; placement: Placement }>>(new Map());
  const pinLayerRef = useRef<L.LayerGroup | null>(null);
  // Read inside Leaflet handlers so they never close over a stale callback.
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Build the chart once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bounds: L.LatLngBoundsExpression = [
      [WORLD_BOUNDS.south, WORLD_BOUNDS.west],
      [WORLD_BOUNDS.north, WORLD_BOUNDS.east],
    ];

    const map = L.map(container, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 1.5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: false,
      maxBounds: L.latLngBounds(bounds).pad(0.25),
      maxBoundsViscosity: 0.9,
    });

    for (const area of [...LEVELS, UNCHARTED]) {
      const uncharted = area === UNCHARTED;

      L.rectangle(boundsOf(area), {
        color: '#14140f',
        weight: 2,
        dashArray: uncharted ? '6 6' : undefined,
        fillColor: uncharted ? '#6d6753' : '#f4efd9',
        fillOpacity: uncharted ? 0.25 : 0.7,
        interactive: false,
      }).addTo(map);

      L.marker([area.y + area.h - 10, area.x + 12], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'level-label',
          iconSize: [0, 0],
          html: `<span class="level-label__key">${area.label}</span><span class="level-label__name">${area.name}</span>`,
        }),
      }).addTo(map);
    }

    // Stairwells between consecutive levels.
    const byKey = new Map(LEVELS.map((level) => [level.key, level]));
    const path = ROUTE.flatMap((key) => {
      const level = byKey.get(key);
      return level ? [centreOf(level)] : [];
    });
    L.polyline(path, {
      color: '#14140f',
      weight: 2,
      opacity: 0.55,
      dashArray: '2 8',
      interactive: false,
    }).addTo(map);

    pinLayerRef.current = L.layerGroup().addTo(map);
    map.fitBounds(bounds);
    mapRef.current = map;

    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      pinLayerRef.current = null;
      markers.clear();
    };
  }, []);

  // Pins follow the listings.
  useEffect(() => {
    const layer = pinLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    markersRef.current.clear();

    for (const placement of placements) {
      const { property } = placement;
      const marker = L.marker(placement.position, {
        icon: pinIcon(placement, property._id === selectedRef.current),
        title: `${property.title} — ${property.level}, ${property.sector}`,
        alt: property.title,
        keyboard: true,
        riseOnHover: true,
      });
      marker.on('click', () => onSelectRef.current(property._id));
      marker.addTo(layer);
      markersRef.current.set(property._id, { marker, placement });
    }
  }, [placements]);

  // Selection: restyle pins and bring the chosen unit into view.
  useEffect(() => {
    const previous = selectedRef.current;
    selectedRef.current = selectedId;

    for (const id of [previous, selectedId]) {
      const entry = id ? markersRef.current.get(id) : undefined;
      if (entry) entry.marker.setIcon(pinIcon(entry.placement, entry.placement.property._id === selectedId));
    }

    const selected = selectedId ? markersRef.current.get(selectedId) : undefined;
    const map = mapRef.current;
    if (selected && map) {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      map.flyTo(selected.placement.position, Math.max(map.getZoom(), -0.5), {
        animate: !reduceMotion,
        duration: 0.6,
      });
    }
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="level-map h-full w-full"
      role="application"
      aria-label="Survey chart of the levels. Use the file list beside the chart for a text version."
    />
  );
};

export default LevelMap;
