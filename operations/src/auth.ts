const encoder = new TextEncoder();

async function digest(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", encoder.encode(value));
}

export async function timingSafeStringEqual(provided: string, expected: string): Promise<boolean> {
  const [providedDigest, expectedDigest] = await Promise.all([
    digest(provided),
    digest(expected),
  ]);
  return crypto.subtle.timingSafeEqual(providedDigest, expectedDigest);
}

export async function hasValidBearerToken(request: Request, secret: string): Promise<boolean> {
  if (!secret) return false;

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const provided = authorization.slice("Bearer ".length);
  return timingSafeStringEqual(provided, secret);
}

export async function hasValidBasicCredentials(
  request: Request,
  expectedUsername: string,
  expectedPassword: string,
): Promise<boolean> {
  if (!expectedUsername || !expectedPassword) return false;
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    const [usernameMatches, passwordMatches] = await Promise.all([
      timingSafeStringEqual(username, expectedUsername),
      timingSafeStringEqual(password, expectedPassword),
    ]);
    return usernameMatches && passwordMatches;
  } catch {
    return false;
  }
}
