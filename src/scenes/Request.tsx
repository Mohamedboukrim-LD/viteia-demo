import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { tracked } from "../api/log";
import { ApiPanel } from "../components/ApiPanel";
import { AssistantChat } from "../components/AssistantChat";
import { ASSISTANT_REPLY, EXPERIMENT_REQUEST, PROPOSAL, USER_REQUEST } from "../data/proposal";
import { useDemoStore } from "../store/demoStore";
import "./Request.css";

const unreachable = (e: unknown) =>
  e instanceof ApiError ? e.message : "The API is not reachable. Start the mock with `npm run mock`.";

export function Request() {
  const phase = useDemoStore((s) => s.requestPhase);
  const setPhase = useDemoStore((s) => s.setRequestPhase);
  const setRequestText = useDemoStore((s) => s.setRequestText);
  const proposal = useDemoStore((s) => s.proposal);
  const setProposal = useDemoStore((s) => s.setProposal);
  const booking = useDemoStore((s) => s.booking);
  const setBooking = useDemoStore((s) => s.setBooking);
  const experiment = useDemoStore((s) => s.experiment);
  const setExperiment = useDemoStore((s) => s.setExperiment);
  const testbeds = useDemoStore((s) => s.testbeds);
  const setTestbeds = useDemoStore((s) => s.setTestbeds);
  const [error, setError] = useState<string | null>(null);

  // Scene opened directly (not from scene 1): load the catalogue for names.
  useEffect(() => {
    if (testbeds.length) return;
    api.listTestbeds().then((l) => setTestbeds(l.items)).catch(() => undefined);
  }, [testbeds.length, setTestbeds]);

  // Phase "proposed": the scripted assistant answer becomes the booking request.
  useEffect(() => {
    if (phase === "proposed" && !proposal) setProposal(PROPOSAL);
  }, [phase, proposal, setProposal]);

  // Phase "booking": POST /bookings.
  useEffect(() => {
    if (phase !== "booking" || !proposal) return;
    let cancelled = false;
    tracked({ method: "POST", path: "/bookings", request: proposal }, 201, () => api.createBooking(proposal))
      .then((b) => {
        if (cancelled) return;
        setBooking(b);
        setPhase("booked");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(unreachable(e));
        setPhase("proposed");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, proposal, setBooking, setPhase]);

  // Phase "starting": POST /experiments, then POST /experiments/{id}/start.
  useEffect(() => {
    if (phase !== "starting" || !booking) return;
    let cancelled = false;
    const request = EXPERIMENT_REQUEST(booking.id);
    tracked({ method: "POST", path: "/experiments", request }, 201, () => api.createExperiment(request))
      .then((created) =>
        tracked({ method: "POST", path: `/experiments/${created.id}/start` }, 202, () =>
          api.startExperiment(created.id),
        ),
      )
      .then((running) => {
        if (cancelled) return;
        setExperiment(running);
        setPhase("started");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(unreachable(e));
        setPhase("booked");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, booking, setExperiment, setPhase]);

  const onTyped = useCallback(() => {
    setRequestText(USER_REQUEST);
    setPhase("sent");
  }, [setRequestText, setPhase]);

  const onBook = useCallback(() => {
    setError(null);
    setPhase("booking");
  }, [setPhase]);

  const onStart = useCallback(() => {
    setError(null);
    setPhase("starting");
  }, [setPhase]);

  const assistantVisible = !["idle", "typing", "sent"].includes(phase);

  return (
    <div className="request">
      <section className="request__chat" aria-label="Assistant">
        <AssistantChat
          userText={USER_REQUEST}
          assistantReply={assistantVisible ? ASSISTANT_REPLY : null}
          proposal={proposal}
          booking={booking}
          experiment={experiment}
          bookingPending={phase === "booking"}
          startPending={phase === "starting"}
          onTyped={onTyped}
          onBook={onBook}
          onStart={onStart}
        />
        {error && <p role="alert" className="request__error">{error}</p>}
      </section>
      <ApiPanel />
    </div>
  );
}
