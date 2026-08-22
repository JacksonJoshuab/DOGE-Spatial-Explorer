type FetchLike = typeof fetch;

type Environment = Record<string, string | undefined>;

interface MetaDebugResponse {
  data?: {
    app_id?: string | number;
    is_valid?: boolean;
    user_id?: string | number;
    scopes?: string[];
  };
}

export interface VerifiedMetaIdentity {
  subject: string;
  scopes: string[];
}

/**
 * Verifies a Meta platform access token with the app-level debug endpoint.
 * The client token is never trusted without server-side introspection.
 */
export async function verifyMetaAccessToken(
  accessToken: string,
  env: Environment = process.env,
  fetchImpl: FetchLike = globalThis.fetch,
): Promise<VerifiedMetaIdentity> {
  const appId = env.META_APP_ID;
  const appSecret = env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Set META_APP_ID and META_APP_SECRET to enable Meta Quest/Horizon sign-in");
  }

  const endpoint = env.META_TOKEN_DEBUG_URL ?? "https://graph.facebook.com/debug_token";
  const url = new URL(endpoint);
  url.searchParams.set("input_token", accessToken);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => null) as MetaDebugResponse | null;
  const data = body?.data;

  if (!response.ok || !data?.is_valid || String(data.app_id) !== appId || !data.user_id) {
    throw new Error("Meta access token is invalid for this application");
  }

  return { subject: String(data.user_id), scopes: data.scopes ?? [] };
}
