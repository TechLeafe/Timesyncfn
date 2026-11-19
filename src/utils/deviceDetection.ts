
export const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const mobileUA =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|BlackBerry|Opera Mini|webOS/i.test(
      userAgent
    );

  const mobilePlatform =
    /Android|iPhone|iPad|iPod/i.test(platform);

  const touchMac =
    platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  return mobileUA || mobilePlatform || touchMac;
};
