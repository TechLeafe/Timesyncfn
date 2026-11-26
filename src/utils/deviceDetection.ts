
export const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const userAgentData = (
    navigator as Navigator & {
      userAgentData?: {
        mobile?: boolean;
        platform?: string;
      };
    }
  ).userAgentData;

  const detectedPlatform = userAgentData?.platform || "";
  const touchPoints = navigator.maxTouchPoints || 0;

  // Detect mobile devices
  const mobileUA =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|BlackBerry|webOS|Opera Mini/i.test(
      ua
    );

  const mobilePlatform =
    /Android|iPhone|iPad|iPod/i.test(platform) ||
    /Android|iOS/i.test(detectedPlatform) ||
    userAgentData?.mobile === true;

  if (mobileUA || mobilePlatform) {
    return true;
  }

  // Block iPad desktop mode
  const iPadDesktop =
    /MacIntel|Macintosh/i.test(platform + " " + ua) &&
    touchPoints > 1;

  if (iPadDesktop) {
    return true;
  }

  // Allow Windows laptops and desktops
  // Including ThinkPad and touchscreen laptops
  const isWindows =
    /Windows/i.test(ua) ||
    /Win32|Win64/i.test(platform) ||
    /Windows/i.test(detectedPlatform);

  if (isWindows) {
    return false;
  }

  // Allow MacBook and Mac desktops
  const isMac =
    /Macintosh|MacIntel|Mac OS/i.test(ua + " " + platform) ||
    /macOS/i.test(detectedPlatform);

  if (isMac) {
    return false;
  }

  // Detect possible mobile desktop mode
  const possibleMobileDesktop =
    touchPoints > 0 &&
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(any-hover: hover)").matches;

  return possibleMobileDesktop;
};
