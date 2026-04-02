# DOGE-Landscaper Tools

## GLB Compression Pipeline

### `compress_glb.py`

Compresses the raw LiDAR scan GLB from 44MB to ~23MB using:

1. **WebP texture re-encoding** — Embedded JPEG textures re-encoded as WebP at quality 62 (~60% smaller)
2. **Vertex quantization** — POSITION VEC3 FLOAT32 → INT16 normalized (~50% smaller geometry)
3. **UV quantization** — TEXCOORD VEC2 FLOAT32 → USHORT normalized (~50% smaller UVs)
4. **Index downcasting** — UINT32 indices → USHORT where vertex count < 65535

### Usage

```bash
pip install pillow numpy
python3 compress_glb.py
# Reads:  /home/ubuntu/webdev-static-assets/backyard.glb  (44MB)
# Writes: /home/ubuntu/webdev-static-assets/backyard-compressed.glb  (23MB)
```

### After compression

Upload the compressed GLB to the CDN:
```bash
manus-upload-file --webdev /home/ubuntu/webdev-static-assets/backyard-compressed.glb
```

Then update `GLB_URL` in `client/src/components/LidarViewer3D.tsx`.

### Compression results

| File | Size | Notes |
|------|------|-------|
| `backyard.glb` (original) | 44.2 MB | JPEG textures, FLOAT32 geometry |
| `backyard-compressed.glb` | 23.0 MB | WebP textures, INT16/USHORT geometry |

