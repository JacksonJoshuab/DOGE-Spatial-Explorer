// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Ecosystem from "./Ecosystem";

const mocks = vi.hoisted(() => ({ analyze: vi.fn(), timeline: vi.fn() }));

const snapshot = {
  health: {
    configuredCount: 1,
    total: 5,
    state: "partial",
    providers: [
      { id: "openai", label: "OpenAI", category: "AI", configured: true },
      { id: "nvidia", label: "NVIDIA NIM", category: "AI", configured: false },
      { id: "meta", label: "Meta Horizon OS", category: "Spatial", configured: false },
      { id: "apple", label: "Apple Spatial", category: "Spatial", configured: false },
      { id: "microsoft", label: "Microsoft Entra ID", category: "Identity", configured: false },
    ],
  },
  diagnostics: [
    { provider: "openai", label: "OpenAI", configured: true, latencyMs: null, state: "ready for operator check" },
    { provider: "nvidia", label: "NVIDIA NIM", configured: false, latencyMs: null, state: "awaiting configuration" },
  ],
  overlays: [{ id: "o1", label: "Harbor ingress", x: 18, y: 30, priority: "priority", detail: "AIS corridor density above baseline" }],
  apple: { configured: false, appIds: [], associationPath: "/.well-known/apple-app-site-association" },
  meta: { configured: false, appIdPresent: false, state: "waiting for target application ID" },
  entra: { configured: false, completeCount: 0, checklist: [{ id: "tenant", label: "Confirm Microsoft Entra tenant", complete: false }] },
  posture: { score: 17, checks: [{ id: "server-boundary", label: "Provider credentials stay server-side", passed: true, detail: "No browser secrets." }] },
};

const timelineRows = [{ id: "evt-1", type: "security", title: "Provider posture scanned", detail: "Server-only credential boundaries verified.", priority: "routine", timestamp: "2026-08-22T21:40:00.000Z" }];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    ecosystem: {
      analyze: {
        useMutation: (options: { onSuccess?: (result: { provider: string; model: string; text: string }) => void }) => ({
          mutate: (input: { provider: string; prompt: string }) => {
            mocks.analyze(input);
            options.onSuccess?.({ provider: input.provider, model: "integration-test", text: "Provider analysis completed" });
          },
          isPending: false,
        }),
      },
    },
    commandCenter: {
      snapshot: { useQuery: () => ({ data: snapshot, isLoading: false, isError: false }) },
      timeline: { useQuery: (input: unknown) => { mocks.timeline(input); return { data: timelineRows }; } },
      composeBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      buildManifest: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(() => {
  mocks.analyze.mockClear();
  mocks.timeline.mockClear();
});

describe("Ecosystem page", () => {
  it("renders ten command-center feature surfaces and drives a selected provider diagnostic", async () => {
    const user = userEvent.setup();
    render(<Ecosystem />);

    expect(screen.getByRole("heading", { name: "Ecosystem Command Center" })).toBeTruthy();
    expect(screen.getByText("Feature 2 · Session manifest")).toBeTruthy();
    expect(screen.getByText("Feature 3 · Provider diagnostics")).toBeTruthy();
    expect(screen.getByText("Feature 4 · Mission brief")).toBeTruthy();
    expect(screen.getByText("Feature 5 · Live overlay board")).toBeTruthy();
    expect(screen.getByText("Feature 6 · Apple association inspector")).toBeTruthy();
    expect(screen.getByText("Feature 7 · Meta handoff console")).toBeTruthy();
    expect(screen.getByText("Feature 8 · Entra readiness")).toBeTruthy();
    expect(screen.getByText("Feature 9 · Ecosystem activity")).toBeTruthy();
    expect(screen.getByText("Feature 10 · Secure posture")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /NVIDIA NIM/i }));
    const prompt = screen.getByRole("textbox", { name: "Diagnostic prompt" });
    await user.clear(prompt);
    await user.type(prompt, "Assess the maritime corridor.");
    await user.click(screen.getByRole("button", { name: "Run diagnostic" }));

    expect(mocks.analyze).toHaveBeenCalledWith({ provider: "nvidia", prompt: "Assess the maritime corridor." });
    await waitFor(() => expect(screen.getByText("Provider analysis completed")).toBeTruthy());
    expect(screen.getByText("nvidia · integration-test")).toBeTruthy();
  });
});
