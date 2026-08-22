# Vendor Integration Research Notes

## OpenAI

The official OpenAI developer quickstart documents server-side use of an API key supplied through the `OPENAI_API_KEY` environment variable. The key must remain outside client-side code and is read by the provider SDK or server runtime.

Source: https://developers.openai.com/api/docs/quickstart

## NVIDIA NIM

The official NVIDIA NIM documentation describes an OpenAI-compatible inference interface, including `POST /v1/responses`, `POST /v1/chat/completions`, streaming, tool calling, and model discovery through `GET /v1/models`. A provider adapter can therefore expose a normalized response interface while routing to either OpenAI or NVIDIA NIM through separate server-side credentials and base URLs.

Source: https://docs.nvidia.com/nim/large-language-models/latest/reference/api-reference.html

## Design Implication

The application should use a server-only provider adapter. It must select providers by explicit configuration, validate credentials at runtime, expose a limited typed procedure to the client, and never send a provider key or unrestricted endpoint directly to the browser.

## Meta Horizon OS

Meta Horizon OS supports cross-app deep linking. The originating and receiving apps must both implement the integration. The originating application calls `launchOtherApp` with the target app ID and an optional deep-link message. The target reads the launch details and validates the message before navigating to the intended spatial content. Availability is subject to installed-app entitlement and Meta developer policy requirements.

Source: https://developers.meta.com/horizon/documentation/spatial-sdk/ps-deep-linking/

## Apple visionOS

Apple universal links provide the appropriate web-to-app handoff model for the visionOS, iPadOS, and tvOS applications already present in the public monorepo. The app and website must establish an associated-domain relationship. The native app receives an HTTP or HTTPS URL in `NSUserActivity` and must validate all URL paths and parameters before using them to open content.

Source: https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app

## Spatial Link Design Implication

The web command center should create a short-lived, signed session reference rather than place sensitive context directly in a deep-link URL. The Apple and Meta clients must validate that reference with the collaboration backend before joining or opening a spatial scene.

## Microsoft Entra ID

Microsoft Entra ID supports enterprise single sign-on through OpenID Connect. A web integration requires an app registration, a configured redirect URI, the appropriate sign-in audience, and server-side validation of issued tokens through the provider's discovery metadata and signing keys. The existing Manus authentication flow should remain the default until an Entra application registration and tested redirect flow are configured.

Source: https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Proposed Initial Capability Boundary

The current web command center will provide server-side OpenAI and NVIDIA NIM analysis routing, vendor readiness checks, an Apple universal-link association endpoint, and a documented Meta spatial handoff contract. Microsoft support will provide readiness and configuration boundaries for a future Entra OIDC sign-in flow rather than replace the current Manus authentication flow. Native Apple and Meta applications in the public monorepo remain responsible for their platform SDK calls and must validate signed session references before opening spatial content.
