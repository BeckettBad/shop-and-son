import { env } from "cloudflare:workers";
import {
  createExecutionContext,
  createScheduledController,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { createWorker } from "../src/worker";

describe("scheduled Worker handler", () => {
  it("passes the environment and scheduled time to the operations runner", async () => {
    const runChecks = vi.fn().mockResolvedValue(undefined);
    const testWorker = createWorker(runChecks);
    const controller = createScheduledController({
      cron: "*/5 * * * *",
      scheduledTime: Date.parse("2026-07-16T06:00:00.000Z"),
    });
    const context = createExecutionContext();

    testWorker.scheduled(controller, env, context);
    await waitOnExecutionContext(context);

    expect(runChecks).toHaveBeenCalledOnce();
    expect(runChecks.mock.calls[0]?.[0] === env).toBe(true);
    expect(runChecks.mock.calls[0]?.[1]).toEqual(new Date("2026-07-16T06:00:00.000Z"));
  });
});
