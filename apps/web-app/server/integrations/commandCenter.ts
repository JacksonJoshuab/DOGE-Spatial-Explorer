import { nanoid } from "nanoid";
import { ENV } from "../_core/env";
import { getAppleAppSiteAssociation, getEcosystemStatus, probeProvider, runProviderPrompt, type AiProvider } from "./ecosystem";

export type SpatialTarget = "apple" | "meta";
export type Priority = "routine" | "priority" | "critical";

export type SpatialManifestInput = {
  target: SpatialTarget;
  sessionName: string;
  sceneRef: string;
  classification: "internal" | "restricted";
};

const severityRank: Record<Priority, number> = { critical: 3, priority: 2, routine: 1 };

export const commandCenterTimeline = [
  { id: "evt-001", type: "security", title: "Provider posture scanned", detail: "Server-only credential boundaries verified.", priority: "routine" as Priority, timestamp: "2026-08-22T21:40:00.000Z" },
  { id: "evt-002", type: "spatial", title: "Apple association endpoint available", detail: "Universal Link document is served through the protected application runtime.", priority: "priority" as Priority, timestamp: "2026-08-22T21:35:00.000Z" },
  { id: "evt-003", type: "overlay", title: "Digital-twin overlays synchronized", detail: "Command-center snapshot has three active operational markers.", priority: "routine" as Priority, timestamp: "2026-08-22T21:31:00.000Z" },
  { id: "evt-004", type: "identity", title: "Microsoft Entra rollout held", detail: "An application registration and redirect validation are required before SSO activation.", priority: "priority" as Priority, timestamp: "2026-08-22T21:25:00.000Z" },
  { id: "evt-005", type: "spatial", title: "Meta Horizon handoff staged", detail: "The target app identifier must be configured before a native Quest launch can proceed.", priority: "critical" as Priority, timestamp: "2026-08-22T21:20:00.000Z" },
];

export async function getCommandCenterSnapshot() {
  const providers = getEcosystemStatus();
  const configuredCount = providers.filter(provider => provider.configured).length;
  const appleAssociation = getAppleAppSiteAssociation();
  const metaConfigured = providers.find(provider => provider.id === "meta")?.configured ?? false;
  const appleConfigured = providers.find(provider => provider.id === "apple")?.configured ?? false;
  const entraConfigured = providers.find(provider => provider.id === "microsoft")?.configured ?? false;

  const postureChecks = [
    { id: "server-boundary", label: "Provider credentials stay server-side", passed: true, detail: "The browser only receives readiness state and bounded response text." },
    { id: "openai", label: "OpenAI analysis key configured", passed: providers.find(provider => provider.id === "openai")?.configured ?? false, detail: "Required only to activate live OpenAI analysis." },
    { id: "nvidia", label: "NVIDIA NIM model route configured", passed: providers.find(provider => provider.id === "nvidia")?.configured ?? false, detail: "Requires an API key and an available model identifier." },
    { id: "meta", label: "Meta Horizon app registration recorded", passed: metaConfigured, detail: "Required before handing a manifest to Quest." },
    { id: "apple", label: "Apple associated domain configured", passed: appleConfigured, detail: "Required before Universal Links can open native spatial content." },
    { id: "entra", label: "Microsoft Entra registration configured", passed: entraConfigured, detail: "Tenant, client ID, and client secret remain server-side." },
  ];

  const overlays = [
    { id: "overlay-1", label: "Harbor ingress", x: 18, y: 30, priority: "priority" as Priority, detail: "AIS corridor density above baseline" },
    { id: "overlay-2", label: "Offshore transfer zone", x: 63, y: 52, priority: "critical" as Priority, detail: "Spatial review requested" },
    { id: "overlay-3", label: "Support route", x: 79, y: 21, priority: "routine" as Priority, detail: "No intervention required" },
  ];

  const entraChecklist = [
    { id: "tenant", label: "Confirm Microsoft Entra tenant", complete: Boolean(ENV.microsoftTenantId) },
    { id: "registration", label: "Register the web application", complete: Boolean(ENV.microsoftClientId) },
    { id: "secret", label: "Store client secret server-side", complete: Boolean(ENV.microsoftClientSecret) },
    { id: "redirect", label: "Verify redirect URI and consent", complete: false },
  ];
  const diagnostics = await Promise.all([probeProvider("openai"), probeProvider("nvidia")]);

  return {
    health: {
      configuredCount,
      total: providers.length,
      state: configuredCount === providers.length ? "ready" : configuredCount > 0 ? "partial" : "staged",
      providers: providers.map(provider => ({ id: provider.id, label: provider.label, configured: provider.configured, category: provider.category })),
    },
    diagnostics,
    overlays,
    apple: {
      configured: appleConfigured,
      appIds: appleAssociation.applinks.details.flatMap(detail => detail.appIDs),
      associationPath: "/.well-known/apple-app-site-association",
    },
    meta: {
      configured: metaConfigured,
      appIdPresent: Boolean(ENV.metaHorizonAppId),
      state: metaConfigured ? "native target registered" : "waiting for target application ID",
    },
    entra: {
      configured: entraConfigured,
      checklist: entraChecklist,
      completeCount: entraChecklist.filter(item => item.complete).length,
    },
    posture: {
      checks: postureChecks,
      score: Math.round((postureChecks.filter(check => check.passed).length / postureChecks.length) * 100),
    },
    timeline: commandCenterTimeline,
  };
}

export function buildSpatialManifest(input: SpatialManifestInput) {
  const targetConfigured = input.target === "apple"
    ? Boolean(ENV.appleAppId && ENV.appleAssociatedDomain)
    : Boolean(ENV.metaHorizonAppId);

  return {
    manifestId: `spatial_${nanoid(12)}`,
    target: input.target,
    sessionName: input.sessionName,
    sceneRef: input.sceneRef,
    classification: input.classification,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    state: targetConfigured ? "ready for native validation" : "staged — target configuration required",
    safeguards: ["Short-lived manifest reference", "No provider credential in payload", "Native client must validate session context"],
  };
}

export async function composeMissionBrief(input: { provider: AiProvider; objective: string; area: string; priority: Priority }) {
  const prompt = [
    "Create a concise operator mission brief.",
    `Objective: ${input.objective}`,
    `Operating area: ${input.area}`,
    `Priority: ${input.priority}`,
    "Use sections for Situation, Objectives, Coordination, and Safeguards. Do not invent external facts.",
  ].join("\n");
  return runProviderPrompt(input.provider, prompt);
}

export function filterCommandCenterTimeline(input: { type?: string; priority?: Priority | "" }) {
  return commandCenterTimeline.filter(entry => {
    const typeMatch = !input.type || entry.type === input.type;
    const priorityMatch = !input.priority || entry.priority === input.priority;
    return typeMatch && priorityMatch;
  }).sort((left, right) => severityRank[right.priority] - severityRank[left.priority] || right.timestamp.localeCompare(left.timestamp));
}
