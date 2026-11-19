
export const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const mobileUA =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry/i.test(
      ua
    );

  const mobilePlatform =
    /Android|iPhone|iPad|iPod/i.test(platform);

  const iPadDesktop =
    platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  return mobileUA || mobilePlatform || iPadDesktop;
};
