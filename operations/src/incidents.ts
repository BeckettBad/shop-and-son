export interface ProbeResult {
  checkedAt: string;
  detail: string;
  healthy: boolean;
}

export interface IncidentState {
  consecutiveFailures: number;
  latestDetail: string;
  openedAt: string | null;
  status: "healthy" | "pending" | "open";
}

export interface IncidentTransition {
  at: string;
  kind: "opened" | "recovered";
}

export interface IncidentOutcome {
  state: IncidentState;
  transition: IncidentTransition | null;
}

const FAILURE_THRESHOLD = 2;

export function createIncidentState(): IncidentState {
  return {
    consecutiveFailures: 0,
    latestDetail: "",
    openedAt: null,
    status: "healthy",
  };
}

export function applyProbe(state: IncidentState, probe: ProbeResult): IncidentOutcome {
  if (probe.healthy) {
    return {
      state: createIncidentState(),
      transition: state.status === "open" ? { at: probe.checkedAt, kind: "recovered" } : null,
    };
  }

  const consecutiveFailures = state.consecutiveFailures + 1;
  const opens = state.status !== "open" && consecutiveFailures >= FAILURE_THRESHOLD;

  return {
    state: {
      consecutiveFailures,
      latestDetail: probe.detail,
      openedAt: opens ? probe.checkedAt : state.openedAt,
      status: opens || state.status === "open" ? "open" : "pending",
    },
    transition: opens ? { at: probe.checkedAt, kind: "opened" } : null,
  };
}
