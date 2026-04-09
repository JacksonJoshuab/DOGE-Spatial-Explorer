/*
 * DOGE-LANDSCAPER — Dual Joystick Controller
 * Design: Minecraft/Roblox style on-screen dual joystick
 * Left stick = move (forward/back/strafe)
 * Right stick = look (camera yaw/pitch)
 * Translucent glass panels with nub indicator
 */

import { useRef, useCallback, useEffect } from "react";

export interface JoystickState {
  x: number; // -1 to 1 (left/right)
  y: number; // -1 to 1 (up/down, -1 = forward in move, -1 = look up in camera)
}

interface JoystickProps {
  label: string;
  side: "left" | "right";
  onMove: (state: JoystickState) => void;
  onRelease?: () => void;
  size?: number;
}

function Joystick({ label, side, onMove, onRelease, size = 100 }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nubRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const radius = size / 2;
  const nubRadius = size * 0.22;

  const wasAtEdgeRef = useRef(false);

  const updateNub = useCallback((dx: number, dy: number) => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = radius - nubRadius;
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;
    if (nubRef.current) {
      nubRef.current.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    }
    const normX = clampedDist > 0 ? (nx / maxDist) : 0;
    const normY = clampedDist > 0 ? (ny / maxDist) : 0;
    onMove({ x: normX, y: normY });
    // Haptic feedback: 10ms pulse when nub first hits edge boundary
    const isAtEdge = dist >= maxDist * 0.97;
    if (isAtEdge && !wasAtEdgeRef.current) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    }
    wasAtEdgeRef.current = isAtEdge;
  }, [radius, nubRadius, onMove]);

  const resetNub = useCallback(() => {
    if (nubRef.current) {
      nubRef.current.style.transform = "translate(-50%, -50%)";
    }
    onMove({ x: 0, y: 0 });
    onRelease?.();
  }, [onMove, onRelease]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (activeRef.current) return;
    const touch = e.changedTouches[0];
    const rect = containerRef.current!.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    touchIdRef.current = touch.identifier;
    activeRef.current = true;
    const dx = touch.clientX - originRef.current.x;
    const dy = touch.clientY - originRef.current.y;
    updateNub(dx, dy);
  }, [updateNub]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!activeRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - originRef.current.x;
        const dy = touch.clientY - originRef.current.y;
        updateNub(dx, dy);
        break;
      }
    }
  }, [updateNub]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        activeRef.current = false;
        touchIdRef.current = null;
        resetNub();
        break;
      }
    }
  }, [resetNub]);

  // Mouse support for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    activeRef.current = true;
    const rect = containerRef.current!.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const dx = e.clientX - originRef.current.x;
    const dy = e.clientY - originRef.current.y;
    updateNub(dx, dy);
  }, [updateNub]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeRef.current) return;
      const dx = e.clientX - originRef.current.x;
      const dy = e.clientY - originRef.current.y;
      updateNub(dx, dy);
    };
    const handleMouseUp = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      resetNub();
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [updateNub, resetNub]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "2px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 0 20px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.05)",
        }}
      />
      {/* Inner guide circle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.55,
          height: size * 0.55,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      {/* Cross guides */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "15%",
        right: "15%",
        height: "1px",
        background: "rgba(255,255,255,0.07)",
        transform: "translateY(-50%)",
      }} />
      <div style={{
        position: "absolute",
        left: "50%",
        top: "15%",
        bottom: "15%",
        width: "1px",
        background: "rgba(255,255,255,0.07)",
        transform: "translateX(-50%)",
      }} />
      {/* Nub */}
      <div
        ref={nubRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: nubRadius * 2,
          height: nubRadius * 2,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: side === "left"
            ? "radial-gradient(circle at 35% 35%, rgba(100,220,100,0.9), rgba(40,160,40,0.7))"
            : "radial-gradient(circle at 35% 35%, rgba(100,160,255,0.9), rgba(40,100,200,0.7))",
          border: "2px solid rgba(255,255,255,0.4)",
          boxShadow: side === "left"
            ? "0 2px 8px rgba(60,200,60,0.5), 0 0 12px rgba(60,200,60,0.3)"
            : "0 2px 8px rgba(60,120,255,0.5), 0 0 12px rgba(60,120,255,0.3)",
          transition: "box-shadow 0.1s",
          pointerEvents: "none",
        }}
      />
      {/* Label */}
      <div style={{
        position: "absolute",
        bottom: -20,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 10,
        color: "rgba(255,255,255,0.45)",
        whiteSpace: "nowrap",
        fontFamily: "monospace",
        letterSpacing: "0.05em",
        pointerEvents: "none",
      }}>
        {label}
      </div>
    </div>
  );
}

interface DualJoystickProps {
  onLeftMove: (state: JoystickState) => void;
  onRightMove: (state: JoystickState) => void;
  visible?: boolean;
  size?: number;
}

export default function DualJoystick({ onLeftMove, onRightMove, visible = true, size = 110 }: DualJoystickProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "0 24px",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {/* Left joystick — MOVE */}
      <div style={{ pointerEvents: "auto", paddingBottom: 8 }}>
        <Joystick
          label="MOVE"
          side="left"
          onMove={onLeftMove}
          size={size}
        />
      </div>

      {/* Right joystick — LOOK */}
      <div style={{ pointerEvents: "auto", paddingBottom: 8 }}>
        <Joystick
          label="LOOK"
          side="right"
          onMove={onRightMove}
          size={size}
        />
      </div>
    </div>
  );
}
