export interface LatestRequestGuard {
  begin(): number;
  cancel(): void;
  isCurrent(request: number): boolean;
}

export function createLatestRequestGuard(): LatestRequestGuard {
  let current = 0;

  return {
    begin() {
      current += 1;
      return current;
    },
    cancel() {
      current += 1;
    },
    isCurrent(request) {
      return request === current;
    },
  };
}
