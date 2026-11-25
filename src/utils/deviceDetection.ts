
export const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const userAgentData = (
    navigator as Navigator & {
      userAgentData?: { mobile?: boolean; platform?: string };
    }
  ).userAgentData;

  const mobileUA =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|BlackBerry|webOS|Opera Mini/i.test(
      ua
    );

  const mobilePlatform =
    /Android|iPhone|iPad|iPod/i.test(platform) ||
    /Android/i.test(userAgentData?.platform || "") ||
    userAgentData?.mobile === true;

  const iPadDesktop =
    platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  const touchPrimaryDevice =
    navigator.maxTouchPoints > 0 &&
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const smallTouchDevice =
    typeof screen !== "undefined" &&
    navigator.maxTouchPoints > 0 &&
    Math.min(screen.width, screen.height) <= 768;

  return (
    mobileUA ||
    mobilePlatform ||
    iPadDesktop ||
    touchPrimaryDevice ||
    smallTouchDevice
  );
};
