import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldUrl from "world-atlas/countries-110m.json?url";
import type { Testbed } from "../api/client";
import "./TestbedMap.css";

type Props = {
  testbeds: Testbed[];
  highlightedId?: string | null;
  onSelect?: (testbed: Testbed) => void;
};

export function TestbedMap({ testbeds, highlightedId, onSelect }: Props) {
  return (
    <figure className="map" aria-label="Map of Europe with the available testbeds">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [15, 51.5], scale: 560 }}
        width={800}
        height={560}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={worldUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                className="map__land"
                tabIndex={-1}
              />
            ))
          }
        </Geographies>

        {testbeds.map((t) => {
          const isHighlighted = t.id === highlightedId;
          const isOnline = t.status === "online";
          return (
            <Marker key={t.id} coordinates={[t.location.lon, t.location.lat]}>
              <g
                role="button"
                tabIndex={0}
                aria-label={`${t.name}, ${t.location.city}, ${isOnline ? "online" : t.status}`}
                className={[
                  "map__marker",
                  isOnline ? "" : "map__marker--off",
                  isHighlighted ? "map__marker--active" : "",
                ].join(" ")}
                onClick={() => onSelect?.(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(t);
                  }
                }}
              >
                <circle r={isHighlighted ? 11 : 8} />
                <text y={-16} textAnchor="middle">
                  {t.location.city}
                </text>
              </g>
            </Marker>
          );
        })}
      </ComposableMap>
    </figure>
  );
}
