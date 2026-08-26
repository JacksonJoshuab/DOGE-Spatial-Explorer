# NVIDIA integration

The Apple navigation path is complete without NVIDIA services.

## CloudXR

The Swift package pins NVIDIA CloudXR Framework 6.2.0 by commit. Use it for a stationary Vision Pro route room, dense digital twins, photogrammetry or Gaussian splats rendered on an RTX/OVX server. The mixed-reality room remains locked during motion and falls back to native RealityKit if streaming is unavailable.

Deployment targets should provide at least 100 Mbps and prefer 200 Mbps with stable, low-latency Wi‑Fi 6E/7 or private 5G. Do not route safety-critical turn prompts through CloudXR.

## Jetson AGX Orin

Recommended field role:

- encrypted NVMe cache;
- explicit-frame hazard/media classification;
- media checksum, proxy and metadata generation;
- store-and-forward when Starlink/cellular is intermittent;
- local network endpoint conforming to `jetson-edge-contract.yaml`.

No photo library, live camera or location history is uploaded automatically.
