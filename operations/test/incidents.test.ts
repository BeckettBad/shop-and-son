import { describe, expect, it } from "vitest";
import { applyProbe, createIncidentState } from "../src/incidents";

describe("incident transitions", () => {
  it("opens an incident on the second consecutive failure", () => {
    const firstFailure = applyProbe(createIncidentState(), {
      checkedAt: "2026-07-16T03:00:00.000Z",
      detail: "site returned 503",
      healthy: false,
    });

    expect(firstFailure.state).toMatchObject({
      consecutiveFailures: 1,
      openedAt: null,
      status: "pending",
    });
    expect(firstFailure.transition).toBeNull();

    const secondFailure = applyProbe(firstFailure.state, {
      checkedAt: "2026-07-16T03:05:00.000Z",
      detail: "site returned 503",
      healthy: false,
    });

    expect(secondFailure.state).toEqual({
      consecutiveFailures: 2,
      latestDetail: "site returned 503",
      openedAt: "2026-07-16T03:05:00.000Z",
      status: "open",
    });
    expect(secondFailure.transition).toEqual({
      at: "2026-07-16T03:05:00.000Z",
      kind: "opened",
    });
  });

  it("keeps repeated failures in the existing open incident", () => {
    const openState = {
      consecutiveFailures: 2,
      latestDetail: "site returned 503",
      openedAt: "2026-07-16T03:05:00.000Z",
      status: "open" as const,
    };

    const outcome = applyProbe(openState, {
      checkedAt: "2026-07-16T03:10:00.000Z",
      detail: "site timed out",
      healthy: false,
    });

    expect(outcome.state).toEqual({
      consecutiveFailures: 3,
      latestDetail: "site timed out",
      openedAt: "2026-07-16T03:05:00.000Z",
      status: "open",
    });
    expect(outcome.transition).toBeNull();
  });

  it("recovers an open incident on the first healthy probe", () => {
    const outcome = applyProbe(
      {
        consecutiveFailures: 3,
        latestDetail: "site timed out",
        openedAt: "2026-07-16T03:05:00.000Z",
        status: "open",
      },
      {
        checkedAt: "2026-07-16T03:15:00.000Z",
        detail: "site returned 200",
        healthy: true,
      },
    );

    expect(outcome.state).toEqual(createIncidentState());
    expect(outcome.transition).toEqual({
      at: "2026-07-16T03:15:00.000Z",
      kind: "recovered",
    });
  });
});
