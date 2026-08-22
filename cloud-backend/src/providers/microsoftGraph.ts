type FetchLike = typeof fetch;

export interface MicrosoftProfile {
  id: string;
  displayName?: string;
  email?: string;
  userPrincipalName?: string;
}

/**
 * Retrieves the minimum profile fields required by the companion application.
 * The caller must obtain a delegated token with Microsoft Graph User.Read scope.
 */
export async function getMicrosoftProfile(
  accessToken: string,
  graphBaseUrl = process.env.MICROSOFT_GRAPH_BASE_URL ?? "https://graph.microsoft.com/v1.0",
  fetchImpl: FetchLike = globalThis.fetch,
): Promise<MicrosoftProfile> {
  const baseUrl = graphBaseUrl.replace(/\/+$/, "");
  const response = await fetchImpl(`${baseUrl}/me?$select=id,displayName,mail,userPrincipalName`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const body = await response.json().catch(() => null) as MicrosoftProfile | { error?: { message?: string } } | null;
  if (!response.ok || !body || !("id" in body)) {
    const detail = body && "error" in body ? body.error?.message : undefined;
    throw new Error(detail ?? "Microsoft Graph profile request failed");
  }
  return body;
}
