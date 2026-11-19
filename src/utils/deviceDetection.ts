
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || "";

  const mobileRegex =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry|Opera Mini/i;

  const mobileUA = mobileRegex.test(ua);

  const mobilePlatform =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgentData?.platform ||
      navigator.platform ||
      ""
    );

  const touchMac =
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  return mobileUA || mobilePlatform || touchMac;
};
