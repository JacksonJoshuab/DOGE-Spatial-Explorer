/*
 * useDevice — Device detection hook
 * Detects: mobile/tablet/desktop, iOS/Android, touch capability, screen size
 * Used to adapt layout and 3D controls for iPhone Pro Max, iPad, Vision Pro, desktop
 */

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type OSType = "ios" | "android" | "macos" | "windows" | "other";

export interface DeviceInfo {
  type: DeviceType;
  os: OSType;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isIPad: boolean;
  isIPhone: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isLandscape: boolean;
  // Specific form factors
  isIPhoneProMax: boolean; // 430px+ wide in portrait
  isVisionPro: boolean;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // OS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && isTouch);
  const isIPad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && isTouch && width >= 768);
  const isIPhone = isIOS && !isIPad;
  const isAndroid = /Android/.test(ua);
  const isMacOS = /Macintosh/.test(ua) && !isTouch;
  const isWindows = /Windows/.test(ua);
  const isVisionPro = /Reality/.test(ua) || (isMacOS && window.screen.width >= 1366 && isTouch);

  let os: OSType = "other";
  if (isIOS) os = "ios";
  else if (isAndroid) os = "android";
  else if (isMacOS) os = "macos";
  else if (isWindows) os = "windows";

  // Device type by screen width
  let type: DeviceType = "desktop";
  if (isIPhone || (isTouch && width < 768)) type = "mobile";
  else if (isIPad || (isTouch && width >= 768 && width < 1200)) type = "tablet";

  const isLandscape = width > height;
  // iPhone Pro Max is 430pt wide in portrait (or 932pt in landscape)
  const isIPhoneProMax = isIPhone && ((!isLandscape && width >= 420) || (isLandscape && height >= 420));

  return {
    type,
    os,
    isTouch,
    isMobile: type === "mobile",
    isTablet: type === "tablet",
    isDesktop: type === "desktop",
    isIOS,
    isIPad,
    isIPhone,
    screenWidth: width,
    screenHeight: height,
    pixelRatio: window.devicePixelRatio || 1,
    isLandscape,
    isIPhoneProMax,
    isVisionPro,
  };
}

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(detectDevice);

  useEffect(() => {
    const update = () => setDevice(detectDevice());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return device;
}
