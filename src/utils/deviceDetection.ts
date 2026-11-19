
/**
 * Detect whether the user is accessing
 * TimeSync HRMS from a mobile or tablet.
 *
 * true  = Mobile / Tablet (Restricted)
 * false = Desktop / Laptop (Allowed)
 */

export const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";

  // Detect mobile and tablet devices
  const mobileRegex =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry|Opera Mini/i;

  const isMobile = mobileRegex.test(userAgent);

  // Detect iPad using desktop browser mode
  const isIPad =
    /Macintosh/i.test(userAgent) &&
    navigator.maxTouchPoints > 1;

  return isMobile || isIPad;
};
