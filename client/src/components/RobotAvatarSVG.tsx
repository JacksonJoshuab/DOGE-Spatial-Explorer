/*
 * DOGE-LANDSCAPER — Layered SVG Robot Avatar
 * Chip McHaymaker — The Corn Belt Cultivator
 * Each clothing layer is a separate SVG group that updates in real-time
 * Mirror reflection is a flipped, faded duplicate that updates simultaneously
 */

import React from "react";
import type { RobotPersona } from "@/lib/data";

interface RobotAvatarSVGProps {
  persona: RobotPersona;
  size?: number;
  mirrored?: boolean;
  animated?: boolean;
}

// Hat shape variants
function HatLayer({ hat, color }: { hat: string; color: string }) {
  if (hat.includes("John Deere") || hat.includes("Cap")) {
    return (
      <g id="hat-layer">
        {/* Cap brim */}
        <ellipse cx="100" cy="58" rx="38" ry="7" fill={color} opacity="0.9" />
        {/* Cap body */}
        <path d="M 68 58 Q 70 30 100 28 Q 130 30 132 58 Z" fill={color} />
        {/* Cap button */}
        <circle cx="100" cy="30" r="4" fill={lighten(color, 0.3)} />
        {/* Brim underside shadow */}
        <ellipse cx="100" cy="58" rx="38" ry="7" fill="rgba(0,0,0,0.2)" />
        {/* John Deere logo hint */}
        <text x="100" y="48" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.7)" fontWeight="bold">JD</text>
      </g>
    );
  }
  if (hat.includes("Cowboy")) {
    return (
      <g id="hat-layer">
        <ellipse cx="100" cy="62" rx="48" ry="8" fill={color} opacity="0.9" />
        <path d="M 68 62 Q 72 35 100 32 Q 128 35 132 62 Z" fill={color} />
        <path d="M 52 62 Q 68 62 68 62 Q 60 55 52 62 Z" fill={darken(color, 0.2)} />
        <path d="M 148 62 Q 132 62 132 62 Q 140 55 148 62 Z" fill={darken(color, 0.2)} />
      </g>
    );
  }
  if (hat.includes("Beanie")) {
    return (
      <g id="hat-layer">
        <path d="M 70 60 Q 72 28 100 26 Q 128 28 130 60 Z" fill={color} rx="8" />
        <rect x="68" y="56" width="64" height="10" rx="5" fill={darken(color, 0.15)} />
        <circle cx="100" cy="28" r="6" fill={lighten(color, 0.2)} />
      </g>
    );
  }
  // Default: hard hat
  return (
    <g id="hat-layer">
      <path d="M 65 62 Q 68 30 100 28 Q 132 30 135 62 Z" fill={color} />
      <rect x="60" y="60" width="80" height="8" rx="4" fill={darken(color, 0.2)} />
    </g>
  );
}

// Shirt/torso layer
function ShirtLayer({ shirt, color }: { shirt: string; color: string }) {
  const isPlaid = shirt.includes("Plaid") || shirt.includes("Flannel");
  const isHoodie = shirt.includes("Hoodie");
  const isTshirt = shirt.includes("T-Shirt") || shirt.includes("Tee");

  return (
    <g id="shirt-layer">
      {/* Base torso shape */}
      <path d="M 72 145 L 65 145 L 58 230 L 142 230 L 135 145 L 128 145 Z" fill={color} />
      {/* Collar */}
      <path d="M 88 145 L 100 160 L 112 145 Z" fill={darken(color, 0.2)} />
      {/* Plaid pattern overlay */}
      {isPlaid && (
        <>
          <line x1="75" y1="145" x2="70" y2="230" stroke={lighten(color, 0.3)} strokeWidth="3" opacity="0.4" />
          <line x1="90" y1="145" x2="87" y2="230" stroke={lighten(color, 0.3)} strokeWidth="3" opacity="0.4" />
          <line x1="110" y1="145" x2="113" y2="230" stroke={lighten(color, 0.3)} strokeWidth="3" opacity="0.4" />
          <line x1="125" y1="145" x2="130" y2="230" stroke={lighten(color, 0.3)} strokeWidth="3" opacity="0.4" />
          <line x1="58" y1="165" x2="142" y2="165" stroke={lighten(color, 0.3)} strokeWidth="2" opacity="0.4" />
          <line x1="58" y1="185" x2="142" y2="185" stroke={lighten(color, 0.3)} strokeWidth="2" opacity="0.4" />
          <line x1="58" y1="205" x2="142" y2="205" stroke={lighten(color, 0.3)} strokeWidth="2" opacity="0.4" />
        </>
      )}
      {isHoodie && (
        <path d="M 80 145 Q 100 175 120 145 Q 110 155 100 158 Q 90 155 80 145 Z" fill={darken(color, 0.15)} />
      )}
      {/* Pocket */}
      {!isTshirt && (
        <rect x="105" y="175" width="22" height="18" rx="3" fill={darken(color, 0.15)} />
      )}
      {/* Sleeve left */}
      <path d="M 65 145 L 42 185 L 50 195 L 72 165 Z" fill={color} />
      {/* Sleeve right */}
      <path d="M 135 145 L 158 185 L 150 195 L 128 165 Z" fill={color} />
      {/* Cuff left */}
      <ellipse cx="46" cy="190" rx="8" ry="5" fill={darken(color, 0.2)} />
      {/* Cuff right */}
      <ellipse cx="154" cy="190" rx="8" ry="5" fill={darken(color, 0.2)} />
    </g>
  );
}

// Overalls/pants layer
function OutfitLayer({ outfit, color }: { outfit: string; color: string }) {
  const isDenim = outfit.includes("Denim") || outfit.includes("Overalls");
  const isKhaki = outfit.includes("Khaki");
  const isCargo = outfit.includes("Cargo");

  return (
    <g id="outfit-layer">
      {isDenim && (
        <>
          {/* Bib */}
          <rect x="82" y="150" width="36" height="42" rx="4" fill={color} />
          {/* Bib pocket */}
          <rect x="88" y="158" width="24" height="16" rx="3" fill={darken(color, 0.15)} />
          {/* Straps */}
          <rect x="84" y="148" width="8" height="50" rx="4" fill={color} transform="rotate(-5 88 148)" />
          <rect x="108" y="148" width="8" height="50" rx="4" fill={color} transform="rotate(5 112 148)" />
          {/* Pants legs */}
          <path d="M 68 228 L 72 320 L 96 320 L 100 260 L 104 320 L 128 320 L 132 228 Z" fill={color} />
          {/* Denim stitching */}
          <line x1="100" y1="228" x2="100" y2="320" stroke={lighten(color, 0.25)} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
          <line x1="80" y1="228" x2="78" y2="320" stroke={lighten(color, 0.2)} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
          <line x1="120" y1="228" x2="122" y2="320" stroke={lighten(color, 0.2)} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        </>
      )}
      {!isDenim && (
        <>
          {/* Regular pants */}
          <path d="M 68 228 L 72 320 L 96 320 L 100 260 L 104 320 L 128 320 L 132 228 Z" fill={color} />
          {/* Belt */}
          <rect x="65" y="226" width="70" height="8" rx="3" fill={darken(color, 0.3)} />
          <rect x="96" y="224" width="8" height="12" rx="2" fill="#c0a020" />
          {isCargo && (
            <>
              <rect x="70" y="255" width="20" height="22" rx="3" fill={darken(color, 0.15)} />
              <rect x="110" y="255" width="20" height="22" rx="3" fill={darken(color, 0.15)} />
            </>
          )}
        </>
      )}
    </g>
  );
}

// Boots layer
function BootsLayer({ boots, color }: { boots: string; color: string }) {
  const bootColor = boots.includes("Steel") ? "#3a3a3a" : boots.includes("Rubber") ? "#1a3a1a" : "#5c3a1a";
  return (
    <g id="boots-layer">
      {/* Left boot */}
      <path d="M 72 318 L 68 340 L 58 345 L 56 352 L 96 352 L 96 318 Z" fill={bootColor} />
      <ellipse cx="76" cy="352" rx="20" ry="5" fill={darken(bootColor, 0.2)} />
      {/* Steel toe cap */}
      {boots.includes("Steel") && (
        <ellipse cx="62" cy="349" rx="12" ry="4" fill="#888" opacity="0.7" />
      )}
      {/* Right boot */}
      <path d="M 128 318 L 132 340 L 142 345 L 144 352 L 104 352 L 104 318 Z" fill={bootColor} />
      <ellipse cx="124" cy="352" rx="20" ry="5" fill={darken(bootColor, 0.2)} />
      {boots.includes("Steel") && (
        <ellipse cx="138" cy="349" rx="12" ry="4" fill="#888" opacity="0.7" />
      )}
      {/* Boot laces */}
      {!boots.includes("Rubber") && (
        <>
          <line x1="80" y1="325" x2="92" y2="325" stroke={lighten(bootColor, 0.5)} strokeWidth="1.5" />
          <line x1="80" y1="331" x2="92" y2="331" stroke={lighten(bootColor, 0.5)} strokeWidth="1.5" />
          <line x1="108" y1="325" x2="120" y2="325" stroke={lighten(bootColor, 0.5)} strokeWidth="1.5" />
          <line x1="108" y1="331" x2="120" y2="331" stroke={lighten(bootColor, 0.5)} strokeWidth="1.5" />
        </>
      )}
    </g>
  );
}

// Accessory layer
function AccessoryLayer({ accessory, color }: { accessory: string; color: string }) {
  if (accessory.includes("Scotts") || accessory.includes("Bag")) {
    return (
      <g id="accessory-layer">
        {/* Scotts bag carried on left arm */}
        <rect x="20" y="175" width="30" height="40" rx="4" fill="#f5c518" />
        <rect x="22" y="178" width="26" height="34" rx="3" fill="#2d5a1b" />
        <text x="35" y="196" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">SCOTTS</text>
        <text x="35" y="203" textAnchor="middle" fontSize="4" fill="#f5c518">TURF</text>
        <text x="35" y="209" textAnchor="middle" fontSize="4" fill="#f5c518">BUILDER</text>
        {/* Handle */}
        <path d="M 28 175 Q 35 168 42 175" stroke="#c0a020" strokeWidth="2" fill="none" />
      </g>
    );
  }
  if (accessory.includes("Sprayer")) {
    return (
      <g id="accessory-layer">
        <rect x="22" y="180" width="20" height="35" rx="6" fill="#e0e0e0" />
        <rect x="26" y="175" width="12" height="8" rx="3" fill="#aaa" />
        <line x1="42" y1="195" x2="60" y2="195" stroke="#aaa" strokeWidth="3" />
        <circle cx="60" cy="195" r="4" fill="#888" />
      </g>
    );
  }
  if (accessory.includes("Tablet") || accessory.includes("iPad")) {
    return (
      <g id="accessory-layer">
        <rect x="18" y="172" width="28" height="38" rx="4" fill="#1c1c1e" />
        <rect x="20" y="174" width="24" height="34" rx="3" fill="#007aff" opacity="0.8" />
        <text x="32" y="193" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">DOGE</text>
        <text x="32" y="201" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.7)">LAND</text>
      </g>
    );
  }
  if (accessory.includes("Headphones") || accessory.includes("AirPods")) {
    return (
      <g id="accessory-layer">
        <path d="M 68 82 Q 60 75 62 88" stroke="#1c1c1e" strokeWidth="3" fill="none" />
        <circle cx="62" cy="90" r="5" fill="#1c1c1e" />
        <path d="M 132 82 Q 140 75 138 88" stroke="#1c1c1e" strokeWidth="3" fill="none" />
        <circle cx="138" cy="90" r="5" fill="#1c1c1e" />
      </g>
    );
  }
  // Default: nothing
  return null;
}

// Robot head (consistent, metallic)
function RobotHead({ eyeColor, skinTone }: { eyeColor: string; skinTone: string }) {
  return (
    <g id="head-layer">
      {/* Neck */}
      <rect x="88" y="130" width="24" height="20" rx="4" fill={skinTone} />
      {/* Head */}
      <rect x="68" y="75" width="64" height="60" rx="16" fill={skinTone} />
      {/* Visor / face plate */}
      <rect x="72" y="82" width="56" height="36" rx="10" fill="rgba(0,0,0,0.6)" />
      {/* Eyes */}
      <ellipse cx="88" cy="100" rx="10" ry="8" fill={eyeColor} opacity="0.9" />
      <ellipse cx="112" cy="100" rx="10" ry="8" fill={eyeColor} opacity="0.9" />
      {/* Eye glow */}
      <ellipse cx="88" cy="100" rx="6" ry="5" fill="white" opacity="0.4" />
      <ellipse cx="112" cy="100" rx="6" ry="5" fill="white" opacity="0.4" />
      {/* Pupil */}
      <circle cx="88" cy="100" r="4" fill={darken(eyeColor, 0.4)} />
      <circle cx="112" cy="100" r="4" fill={darken(eyeColor, 0.4)} />
      {/* Highlight */}
      <circle cx="86" cy="98" r="2" fill="white" opacity="0.8" />
      <circle cx="110" cy="98" r="2" fill="white" opacity="0.8" />
      {/* Mouth / speaker grille */}
      <rect x="82" y="112" width="36" height="6" rx="3" fill="rgba(0,0,0,0.5)" />
      <line x1="84" y1="115" x2="116" y2="115" stroke={eyeColor} strokeWidth="1" opacity="0.5" />
      {/* Ear sensors */}
      <circle cx="68" cy="100" r="6" fill={darken(skinTone, 0.2)} />
      <circle cx="132" cy="100" r="6" fill={darken(skinTone, 0.2)} />
      <circle cx="68" cy="100" r="3" fill={eyeColor} opacity="0.6" />
      <circle cx="132" cy="100" r="3" fill={eyeColor} opacity="0.6" />
      {/* Antenna */}
      <line x1="100" y1="75" x2="100" y2="58" stroke={skinTone} strokeWidth="3" />
      <circle cx="100" cy="55" r="5" fill={eyeColor} opacity="0.8" />
    </g>
  );
}

// Color utility helpers
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 128 : r, isNaN(g) ? 128 : g, isNaN(b) ? 128 : b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

export function RobotAvatarSVG({ persona, size = 200, mirrored = false, animated = true }: RobotAvatarSVGProps) {
  const viewBox = "0 0 200 380";

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size * 1.9}
      style={{
        transform: mirrored ? "scaleY(-1)" : undefined,
        filter: mirrored ? "blur(1px)" : undefined,
        opacity: mirrored ? 0.3 : 1,
        display: "block",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow under feet */}
      <ellipse cx="100" cy="358" rx="45" ry="8" fill="rgba(0,0,0,0.3)" />

      {/* Layer order: boots → outfit → shirt → head → hat → accessory */}
      <BootsLayer boots={persona.boots} color={persona.outfitColor} />
      <OutfitLayer outfit={persona.outfit} color={persona.outfitColor} />
      <ShirtLayer shirt={persona.shirt} color={persona.shirtColor} />
      <RobotHead eyeColor={persona.eyeColor} skinTone={persona.skinTone} />
      <HatLayer hat={persona.hat} color={persona.hatColor} />
      <AccessoryLayer accessory={persona.accessory} color={persona.hatColor} />

      {/* Name badge */}
      {!mirrored && (
        <g>
          <rect x="75" y="195" width="50" height="16" rx="4" fill="rgba(0,0,0,0.5)" />
          <text x="100" y="207" textAnchor="middle" fontSize="7" fill="#f5c518" fontWeight="bold">
            {persona.name.split(" ")[0].toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}

export default RobotAvatarSVG;
