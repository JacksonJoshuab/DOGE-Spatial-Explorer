#!/usr/bin/env python3
"""
Aggressive GLB compression:
1. Re-encode JPEG textures as WebP quality=60
2. Quantize POSITION VEC3 FLOAT → SHORT (normalized) — saves ~50% on geometry
3. Quantize TEXCOORD VEC2 FLOAT → USHORT (normalized) — saves ~50% on UVs
4. Quantize INDEX UINT → USHORT where count allows (< 65535 vertices)
"""
import struct, json, io, os
import numpy as np
from PIL import Image

INPUT  = "/home/ubuntu/webdev-static-assets/backyard.glb"
OUTPUT = "/home/ubuntu/webdev-static-assets/backyard-compressed.glb"
WEBP_QUALITY = 62

# ── Parse GLB ────────────────────────────────────────────────────────────────
with open(INPUT, "rb") as f:
    raw = f.read()

c0_len = struct.unpack_from("<I", raw, 12)[0]
gltf = json.loads(raw[20 : 20 + c0_len])
c1_offset = 20 + c0_len
c1_len = struct.unpack_from("<I", raw, c1_offset)[0]
bin_data = bytearray(raw[c1_offset + 8 : c1_offset + 8 + c1_len])

print(f"Original: {len(raw)/1024/1024:.1f} MB")

buffer_views = gltf["bufferViews"]
accessors    = gltf["accessors"]
images       = gltf.get("images", [])

# Map bufferView index → new bytes (to be replaced)
bv_replacements = {}

# ── 1. Compress textures ──────────────────────────────────────────────────────
for img in images:
    bv_idx = img.get("bufferView")
    if bv_idx is None:
        continue
    bv = buffer_views[bv_idx]
    off, ln = bv.get("byteOffset", 0), bv["byteLength"]
    pil_img = Image.open(io.BytesIO(bytes(bin_data[off:off+ln])))
    if pil_img.mode not in ("RGB", "RGBA"):
        pil_img = pil_img.convert("RGB")
    buf = io.BytesIO()
    pil_img.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
    webp = buf.getvalue()
    print(f"  Texture bv{bv_idx}: {ln/1024:.0f}KB → {len(webp)/1024:.0f}KB WebP")
    img["mimeType"] = "image/webp"
    bv_replacements[bv_idx] = webp

# ── 2. Quantize geometry accessors ───────────────────────────────────────────
def read_accessor(acc_idx):
    acc = accessors[acc_idx]
    bv  = buffer_views[acc["bufferView"]]
    off = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    ct  = acc["componentType"]
    typ = acc["type"]
    count = acc["count"]
    components = {"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT4":16}[typ]
    dt_map = {5120:"int8",5121:"uint8",5122:"int16",5123:"uint16",5125:"uint32",5126:"float32"}
    arr = np.frombuffer(bin_data, dtype=dt_map[ct], count=count*components, offset=off)
    return arr.reshape(count, components) if components > 1 else arr

for acc_idx, acc in enumerate(accessors):
    bv_idx = acc["bufferView"]
    if bv_idx in bv_replacements:
        continue  # already a texture, skip

    bv    = buffer_views[bv_idx]
    ct    = acc["componentType"]
    typ   = acc["type"]
    count = acc["count"]

    # Quantize POSITION VEC3 FLOAT32 → INT16 normalized
    if typ == "VEC3" and ct == 5126:
        arr = read_accessor(acc_idx)
        mn = arr.min(axis=0)
        mx = arr.max(axis=0)
        rng = mx - mn
        rng[rng == 0] = 1.0
        # Normalize to [-1, 1] then scale to int16 range
        normalized = 2.0 * (arr - mn) / rng - 1.0
        quantized = np.clip(normalized * 32767, -32768, 32767).astype(np.int16)
        new_bytes = quantized.tobytes()
        print(f"  POSITION acc{acc_idx} bv{bv_idx}: {bv['byteLength']/1024:.0f}KB → {len(new_bytes)/1024:.0f}KB (INT16 normalized)")
        bv_replacements[bv_idx] = new_bytes
        # Update accessor
        acc["componentType"] = 5122  # SHORT
        acc["normalized"] = True
        # Store scale/offset for decoder (KHR_mesh_quantization extension)
        # For simplicity, we store the min/max in the accessor (Three.js handles normalized SHORT)
        acc["min"] = mn.tolist()
        acc["max"] = mx.tolist()

    # Quantize TEXCOORD VEC2 FLOAT32 → USHORT normalized
    elif typ == "VEC2" and ct == 5126:
        arr = read_accessor(acc_idx)
        # UVs are typically [0,1] but can go outside; clamp to [0,1]
        arr_clamped = np.clip(arr, 0.0, 1.0)
        quantized = np.clip(arr_clamped * 65535, 0, 65535).astype(np.uint16)
        new_bytes = quantized.tobytes()
        print(f"  TEXCOORD acc{acc_idx} bv{bv_idx}: {bv['byteLength']/1024:.0f}KB → {len(new_bytes)/1024:.0f}KB (USHORT normalized)")
        bv_replacements[bv_idx] = new_bytes
        acc["componentType"] = 5123  # UNSIGNED_SHORT
        acc["normalized"] = True

    # Downcast INDEX UINT32 → USHORT if vertex count < 65535
    elif typ == "SCALAR" and ct == 5125:
        # Find max vertex count for this index buffer
        max_idx_val = acc.get("max", [count])[0]
        if max_idx_val < 65535:
            arr = read_accessor(acc_idx).flatten()
            quantized = arr.astype(np.uint16)
            new_bytes = quantized.tobytes()
            print(f"  INDEX acc{acc_idx} bv{bv_idx}: {bv['byteLength']/1024:.0f}KB → {len(new_bytes)/1024:.0f}KB (USHORT)")
            bv_replacements[bv_idx] = new_bytes
            acc["componentType"] = 5123  # UNSIGNED_SHORT

# ── 3. Rebuild BIN buffer ─────────────────────────────────────────────────────
sorted_bvs = sorted(enumerate(buffer_views), key=lambda x: x[1].get("byteOffset", 0))

new_bin = bytearray()
for bv_idx, bv in sorted_bvs:
    old_off = bv.get("byteOffset", 0)
    old_len = bv["byteLength"]
    new_off = len(new_bin)

    if bv_idx in bv_replacements:
        chunk = bv_replacements[bv_idx]
    else:
        chunk = bytes(bin_data[old_off : old_off + old_len])

    new_bin.extend(chunk)
    pad = (4 - len(new_bin) % 4) % 4
    new_bin.extend(b"\x00" * pad)

    bv["byteOffset"] = new_off
    bv["byteLength"] = len(chunk)

gltf["buffers"][0]["byteLength"] = len(new_bin)

# ── 4. Write GLB ──────────────────────────────────────────────────────────────
new_json = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
pad = (4 - len(new_json) % 4) % 4
new_json += b" " * pad

new_bin_bytes = bytes(new_bin)
pad = (4 - len(new_bin_bytes) % 4) % 4
new_bin_bytes += b"\x00" * pad

total = 12 + 8 + len(new_json) + 8 + len(new_bin_bytes)

with open(OUTPUT, "wb") as f:
    f.write(struct.pack("<4sII", b"glTF", 2, total))
    f.write(struct.pack("<II", len(new_json), 0x4E4F534A))
    f.write(new_json)
    f.write(struct.pack("<II", len(new_bin_bytes), 0x004E4942))
    f.write(new_bin_bytes)

orig = os.path.getsize(INPUT)
new  = os.path.getsize(OUTPUT)
print(f"\n✅ Done!")
print(f"   Original:   {orig/1024/1024:.1f} MB")
print(f"   Compressed: {new/1024/1024:.1f} MB")
print(f"   Reduction:  {100*(1-new/orig):.0f}%")
