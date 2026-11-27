import { create } from "zustand";
import { useApiLog } from "../api/log";
import type { Asset, Booking, BookingRequest, Domain, Experiment, Testbed, TelemetryBatch } from "../api/client";

export type Theme = "default" | "contrast";

export type RequestPhase = "idle" | "typing" | "sent" | "proposed" | "booking" | "booked" | "uploading" | "starting" | "started";
export type TwinPhase = "running" | "event" | "stopping" | "stopped";

type DemoState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  testbeds: Testbed[];
  setTestbeds: (items: Testbed[]) => void;
  activeDomains: Domain[];
  toggleDomain: (domain: Domain) => void;
  setDomains: (domains: Domain[]) => void;

  // Request scene
  requestPhase: RequestPhase;
  setRequestPhase: (phase: RequestPhase) => void;
  requestText: string;
  setRequestText: (text: string) => void;
  proposal: BookingRequest | null;
  setProposal: (p: BookingRequest | null) => void;
  booking: Booking | null;
  setBooking: (b: Booking | null) => void;
  asset: Asset | null;
  setAsset: (a: Asset | null) => void;
  // Experiment (scene 2 end, scene 3)
  experiment: Experiment | null;
  setExperiment: (e: Experiment | null) => void;
  twinPhase: TwinPhase;
  setTwinPhase: (phase: TwinPhase) => void;
  telemetry: TelemetryBatch | null;
  setTelemetry: (b: TelemetryBatch | null) => void;
  // Results scene
  showDocs: boolean;
  setShowDocs: (v: boolean) => void;

  reset: () => void;
};

const initial = {
  theme: "default" as Theme,
  testbeds: [] as Testbed[],
  activeDomains: [] as Domain[],
  requestPhase: "idle" as RequestPhase,
  requestText: "",
  proposal: null as BookingRequest | null,
  booking: null as Booking | null,
  asset: null as Asset | null,
  experiment: null as Experiment | null,
  twinPhase: "running" as TwinPhase,
  telemetry: null as TelemetryBatch | null,
  showDocs: false,
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
  setRequestPhase: (requestPhase) => set({ requestPhase }),
  setRequestText: (requestText) => set({ requestText }),
  setProposal: (proposal) => set({ proposal }),
  setBooking: (booking) => set({ booking }),
  setAsset: (asset) => set({ asset }),
  setExperiment: (experiment) => set({ experiment }),
  setTwinPhase: (twinPhase) => set({ twinPhase }),
  setTelemetry: (telemetry) => set({ telemetry }),
  setShowDocs: (showDocs) => set({ showDocs }),
  // Theme survives a reset on purpose: the recording starts in the chosen theme.
  reset: () => {
    useApiLog.getState().clear();
    set((s) => ({ ...initial, theme: s.theme }));
  },
}));

export function filterTestbeds(testbeds: Testbed[], activeDomains: Domain[]): Testbed[] {
  return activeDomains.length === 0
    ? testbeds
    : testbeds.filter((t) => t.domains.some((d) => activeDomains.includes(d)));
}
