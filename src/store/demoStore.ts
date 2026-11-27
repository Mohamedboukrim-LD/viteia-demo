import { create } from "zustand";
import type { Booking, BookingRequest, Domain, Testbed } from "../api/client";

export type Theme = "default" | "contrast";

export type RequestPhase = "idle" | "typing" | "sent" | "proposed" | "booking" | "booked";

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
  // Experiment scene (tranche 3)
  experimentId: string | null;
  setExperimentId: (id: string | null) => void;

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
  setRequestPhase: (requestPhase) => set({ requestPhase }),
  setRequestText: (requestText) => set({ requestText }),
  setProposal: (proposal) => set({ proposal }),
  setBooking: (booking) => set({ booking }),
  setExperimentId: (experimentId) => set({ experimentId }),
  // Theme survives a reset on purpose: the recording starts in the chosen theme.
  reset: () => set((s) => ({ ...initial, theme: s.theme })),
}));

export function filterTestbeds(testbeds: Testbed[], activeDomains: Domain[]): Testbed[] {
  return activeDomains.length === 0
    ? testbeds
    : testbeds.filter((t) => t.domains.some((d) => activeDomains.includes(d)));
}
