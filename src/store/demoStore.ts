import { create } from "zustand";
import type { Domain, Testbed } from "../api/client";

export type Theme = "default" | "contrast";

type DemoState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  testbeds: Testbed[];
  setTestbeds: (items: Testbed[]) => void;
  activeDomains: Domain[];
  toggleDomain: (domain: Domain) => void;
  setDomains: (domains: Domain[]) => void;

  // Filled by the request scene (tranche 2+). Kept here so later scenes read it.
  selectedTestbedIds: string[];
  setSelectedTestbedIds: (ids: string[]) => void;
  experimentId: string | null;
  setExperimentId: (id: string | null) => void;

  reset: () => void;
};

const initial = {
  theme: "default" as Theme,
  testbeds: [] as Testbed[],
  activeDomains: [] as Domain[],
  selectedTestbedIds: [] as string[],
  experimentId: null as string | null,
};

export const useDemoStore = create<DemoState>((set) => ({
  ...initial,
  setTheme: (theme) => set({ theme }),
  setTestbeds: (testbeds) => set({ testbeds }),
  toggleDomain: (domain) =>
    set((s) => ({
      activeDomains: s.activeDomains.includes(domain)
        ? s.activeDomains.filter((d) => d !== domain)
        : [...s.activeDomains, domain],
    })),
  setDomains: (activeDomains) => set({ activeDomains }),
  setSelectedTestbedIds: (selectedTestbedIds) => set({ selectedTestbedIds }),
  setExperimentId: (experimentId) => set({ experimentId }),
  // Theme survives a reset on purpose: the recording starts in the chosen theme.
  reset: () => set((s) => ({ ...initial, theme: s.theme })),
}));

export function filterTestbeds(testbeds: Testbed[], activeDomains: Domain[]): Testbed[] {
  return activeDomains.length === 0
    ? testbeds
    : testbeds.filter((t) => t.domains.some((d) => activeDomains.includes(d)));
}
