import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./client";
import { EXPERIMENT_REQUEST, PROPOSAL } from "../data/proposal";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.restoreAllMocks());

describe("api.createBooking", () => {
  it("posts the booking request as JSON and returns the booking", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(201, { id: "bk-1", status: "confirmed" }),
    );
    const booking = await api.createBooking(PROPOSAL);
    expect(booking.id).toBe("bk-1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/bookings$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(PROPOSAL);
  });

  it("throws an ApiError carrying the problem body on 422", async () => {
    // A Response body can be read once: build a fresh one per call.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(422, { title: "Requested QoS cannot be guaranteed", status: 422, violations: [] }),
    );
    await expect(api.createBooking(PROPOSAL)).rejects.toMatchObject({ status: 422 });
    try {
      await api.createBooking(PROPOSAL);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).problem).toMatchObject({ status: 422 });
    }
  });
});

describe("api experiments", () => {
  it("creates an experiment inside a booking", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(201, { id: "ex-1", status: "created" }),
    );
    const request = EXPERIMENT_REQUEST("bk-1");
    const created = await api.createExperiment(request);
    expect(created.status).toBe("created");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/experiments$/);
    expect(JSON.parse(String(init?.body)).bookingId).toBe("bk-1");
  });

  it("starts and stops without a body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(202, { id: "ex-1", status: "running" }),
    );
    await api.startExperiment("ex-1");
    await api.stopExperiment("ex-1");
    const paths = fetchMock.mock.calls.map(([u]) => String(u));
    expect(paths[0]).toMatch(/\/experiments\/ex-1\/start$/);
    expect(paths[1]).toMatch(/\/experiments\/ex-1\/stop$/);
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });
});
