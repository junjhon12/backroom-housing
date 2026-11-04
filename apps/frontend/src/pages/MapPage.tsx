import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchProperties } from '../services/propertyService';
import { groupByRegion, placeListings } from '../lib/levelMap';
import { HAZARD_META, formatRent } from '../lib/propertyDisplay';
import LevelMap from '../components/LevelMap';
import { PropertyImage } from '../components/PropertyImage';
import { Badge, EmptyState, SectionHeader, Skeleton, buttonStyles } from '../components/ui';

// The API clamps page size to 100, so the chart shows the newest hundred files.
const MAP_QUERY = 'limit=100';

const MapPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const result = await fetchProperties(MAP_QUERY, controller.signal);
        setProperties(result.properties);
        setTotal(result.meta.total);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const placements = useMemo(() => placeListings(properties), [properties]);
  const groups = useMemo(() => groupByRegion(placements), [placements]);
  const selected = properties.find((property) => property._id === selectedId) ?? null;
  const hazard = selected ? (HAZARD_META[selected.hazardClass] ?? HAZARD_META.safe) : null;

  return (
    <div className="space-y-8">
      <header className="border-b border-ink pb-8">
        <SectionHeader
          index="Form 12-C · Survey chart"
          title="Level map"
          description="Every released unit, pinned to the level and sector it was surveyed in. Dashed lines mark the known stairwells. Distances are approximate and the chart is not to be relied upon."
        />
      </header>

      {loading ? (
        <Skeleton className="h-[60vh] w-full" />
      ) : error ? (
        <EmptyState
          title="Chart unavailable"
          description={error}
          action={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={buttonStyles({ variant: 'secondary' })}
            >
              Try again
            </button>
          }
        />
      ) : properties.length === 0 ? (
        <EmptyState
          title="Nothing to chart"
          description="No units are currently released for placement."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="h-[62vh] min-h-[360px] border border-ink bg-cream shadow-hard">
              <LevelMap placements={placements} selectedId={selectedId} onSelect={setSelectedId} />
            </div>

            <ul
              aria-label="Pin legend"
              className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-ink/70"
            >
              {(['safe', 'caution', 'hostile'] as const).map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-3 w-3 border border-ink ${
                      key === 'safe' ? 'bg-moss' : key === 'caution' ? 'bg-cream' : 'bg-signal'
                    }`}
                  />
                  {HAZARD_META[key].label}
                </li>
              ))}
              {total > properties.length && (
                <li className="ml-auto">
                  Showing {properties.length} of {total} files
                </li>
              )}
            </ul>
          </div>

          <aside className="flex flex-col gap-6" aria-label="Files on the chart">
            <section className="border border-ink bg-cream" aria-live="polite">
              <div className="flex items-center justify-between border-b border-ink/25 px-4 py-2.5">
                <span className="text-[10px] uppercase tracking-[0.2em]">Selected file</span>
                <span aria-hidden="true" className="h-2 w-2 bg-signal" />
              </div>

              {selected && hazard ? (
                <div>
                  <div className="aspect-[4/3] border-b border-ink/25 bg-paper-deep">
                    <PropertyImage
                      src={selected.images?.[0]}
                      alt={selected.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
                        {selected.level} · {selected.sector}
                      </p>
                      <Badge variant={hazard.variant}>{hazard.label}</Badge>
                    </div>
                    <h3 className="font-display text-2xl uppercase leading-[0.95]">
                      {selected.title}
                    </h3>
                    <p className="font-display text-xl leading-none">
                      {formatRent(selected.price)}
                      <span className="ml-1 font-mono text-[10px] tracking-[0.14em] text-ink/60">
                        /MO
                      </span>
                    </p>
                    <Link
                      to={`/property/${selected._id}`}
                      className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                    >
                      Open file
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="px-4 py-6 text-sm leading-relaxed text-ink/70">
                  Select a pin, or a file below, to inspect it.
                </p>
              )}
            </section>

            <section className="max-h-[40vh] overflow-y-auto border border-ink bg-cream">
              <h3 className="sticky top-0 border-b border-ink/25 bg-cream px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em]">
                Files by level
              </h3>
              {groups.map(({ region, placements: items }) => (
                <div key={region.key} className="border-b border-ink/15 last:border-b-0">
                  <p className="bg-paper-deep/50 px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] text-ink/70">
                    {region.label} · {region.name}
                  </p>
                  <ul>
                    {items.map(({ property }) => (
                      <li key={property._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(property._id)}
                          aria-pressed={property._id === selectedId}
                          className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-paper ${
                            property._id === selectedId ? 'bg-paper font-medium' : ''
                          }`}
                        >
                          <span className="line-clamp-1">{property.title}</span>
                          <span className="shrink-0 text-[10px] tracking-[0.12em] text-ink/60">
                            {property.sector}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default MapPage;
