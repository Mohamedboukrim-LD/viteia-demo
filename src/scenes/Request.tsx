import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import { ApiPanel, type ApiCall } from "../components/ApiPanel";
import { AssistantChat } from "../components/AssistantChat";
import { ASSISTANT_REPLY, PROPOSAL, USER_REQUEST } from "../data/proposal";
import { useDemoStore } from "../store/demoStore";
import "./Request.css";

export function Request() {
  const phase = useDemoStore((s) => s.requestPhase);
  const setPhase = useDemoStore((s) => s.setRequestPhase);
  const setRequestText = useDemoStore((s) => s.setRequestText);
  const proposal = useDemoStore((s) => s.proposal);
  const setProposal = useDemoStore((s) => s.setProposal);
  const booking = useDemoStore((s) => s.booking);
  const setBooking = useDemoStore((s) => s.setBooking);
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

  // Phase "booking": the only real call of the scene.
  useEffect(() => {
    if (phase !== "booking" || !proposal) return;
    let cancelled = false;
    api
      .createBooking(proposal)
      .then((b) => {
        if (cancelled) return;
        setBooking(b);
        setPhase("booked");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "The API is not reachable. Start the mock with `npm run mock`.");
        setPhase("proposed");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, proposal, setBooking, setPhase]);

  const onTyped = useCallback(() => {
    setRequestText(USER_REQUEST);
    setPhase("sent");
  }, [setRequestText, setPhase]);

  const onBook = useCallback(() => {
    setError(null);
    setPhase("booking");
  }, [setPhase]);

  const call: ApiCall | null = useMemo(() => {
    if (!proposal) return null;
    return {
      method: "POST",
      path: "/v1/bookings",
      request: proposal,
      pending: phase === "booking",
      response: booking ? { status: 201, body: booking } : null,
    };
  }, [proposal, phase, booking]);

  return (
    <div className="request">
      <section className="request__chat" aria-label="Assistant">
        <AssistantChat
          userText={USER_REQUEST}
          assistantReply={phase === "idle" || phase === "typing" || phase === "sent" ? null : ASSISTANT_REPLY}
          proposal={proposal}
          booking={booking}
          bookingPending={phase === "booking"}
          onTyped={onTyped}
          onBook={onBook}
        />
        {error && <p role="alert" className="request__error">{error}</p>}
      </section>
      <ApiPanel call={call} />
    </div>
  );
}
