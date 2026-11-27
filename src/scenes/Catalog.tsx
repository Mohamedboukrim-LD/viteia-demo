import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import { TestbedFilters } from "../components/TestbedFilters";
import { TestbedList } from "../components/TestbedList";
import { TestbedMap } from "../components/TestbedMap";
import { filterTestbeds, useDemoStore } from "../store/demoStore";
import "./Catalog.css";

export function Catalog() {
  const setTestbeds = useDemoStore((s) => s.setTestbeds);
  const testbeds = useDemoStore((s) => s.testbeds);
  const activeDomains = useDemoStore((s) => s.activeDomains);
  const visible = useMemo(() => filterTestbeds(testbeds, activeDomains), [testbeds, activeDomains]);
  const total = testbeds.length;
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listTestbeds()
      .then((list) => {
        if (!cancelled) setTestbeds(list.items);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : "The API is not reachable. Start the mock with `npm run mock`.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [setTestbeds]);

  return (
    <div className="catalog">
      <TestbedFilters />
      <div className="catalog__map">
        {error ? (
          <p role="alert" className="catalog__error">{error}</p>
        ) : (
          <TestbedMap
            testbeds={visible}
            highlightedId={highlightedId}
            onSelect={(t) => setHighlightedId(t.id)}
          />
        )}
      </div>
      <TestbedList
        testbeds={visible}
        total={total}
        highlightedId={highlightedId}
        onSelect={(t) => setHighlightedId(t.id)}
      />
    </div>
  );
}
