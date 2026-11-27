import { useEffect, useState } from "react";
import type { Booking, BookingRequest } from "../api/client";
import { CAPABILITY_LABEL } from "../data/proposal";
import { useDemoStore } from "../store/demoStore";
import "./AssistantChat.css";

type Props = {
  userText: string;
  assistantReply: string | null;
  proposal: BookingRequest | null;
  booking: Booking | null;
  bookingPending: boolean;
  onTyped: () => void;
  onBook: () => void;
};

/* Types a text one character at a time, so the recording shows the
   conversation happening. Resolves `done` when the whole text is shown. */
function useTyped(text: string, speedMs = 18) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speedMs);
    return () => window.clearInterval(id);
  }, [text, speedMs]);
  return { shown, done: text.length > 0 && shown.length === text.length };
}

function formatWindow(w: BookingRequest["window"]) {
  const start = new Date(w.start);
  const end = new Date(w.end);
  const day = start.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${day}, ${time(start)}–${time(end)} UTC`;
}

export function AssistantChat({ userText, assistantReply, proposal, booking, bookingPending, onTyped, onBook }: Props) {
  const phase = useDemoStore((s) => s.requestPhase);
  const testbeds = useDemoStore((s) => s.testbeds);
  const typedUser = useTyped(phase === "typing" ? userText : "");
  const typedReply = useTyped(assistantReply ?? "");

  // When the request has been fully typed into the box, "send" it.
  useEffect(() => {
    if (phase === "typing" && typedUser.done) onTyped();
  }, [phase, typedUser.done, onTyped]);

  const sent = phase !== "idle" && phase !== "typing";
  const name = (id: string) => testbeds.find((t) => t.id === id)?.name ?? id;

  const byTestbed = proposal
    ? proposal.resources.reduce<Record<string, string[]>>((acc, r) => {
        const label = `${r.quantity} × ${CAPABILITY_LABEL[r.capabilityId] ?? r.capabilityId}`;
        (acc[r.testbedId] ??= []).push(label);
        return acc;
      }, {})
    : {};

  return (
    <div className="chat">
      <div className="chat__log">
        {sent && <p className="chat__bubble chat__bubble--user">{userText}</p>}
        {assistantReply && <p className="chat__bubble">{typedReply.shown}</p>}

        {proposal && typedReply.done && (
          <div className="chat__proposal">
            <h3>Proposed configuration</h3>
            <dl>
              <dt>When</dt>
              <dd>{formatWindow(proposal.window)}</dd>
              <dt>Needs</dt>
              <dd>latency ≤ {proposal.qos?.maxLatencyMs} ms, ≥ {proposal.qos?.minFrameRate} fps</dd>
            </dl>
            {Object.entries(byTestbed).map(([id, items]) => (
              <div key={id}>
                <strong>{name(id)}</strong>
                <ul>
                  {items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="chat__actions">
              {booking ? (
                <span className="chat__confirmed">Booking {booking.id}: {booking.status}</span>
              ) : (
                <button type="button" className="btn btn--primary" onClick={onBook} disabled={bookingPending}>
                  {bookingPending ? "Booking…" : "Book these resources"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <form className="chat__input" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          aria-label="Describe what you want to test"
          placeholder="Describe what you want to test"
          value={phase === "typing" ? typedUser.shown : ""}
          readOnly
        />
        <button type="submit" className="btn" disabled>Send</button>
      </form>
    </div>
  );
}
