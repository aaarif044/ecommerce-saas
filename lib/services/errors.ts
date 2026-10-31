export class MockApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "invalid_request", status = 400) {
    super(message);
    this.name = "MockApiError";
    this.code = code;
    this.status = status;
  }
}

export function isMockApiError(error: unknown): error is MockApiError {
  return error instanceof MockApiError;
}

/** Randomised-but-deterministic-ish latency for mock endpoints. */
export function simulateLatency(base = 180, jitter = 160) {
  const ms = base + Math.random() * jitter;
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
