const FESTIVAL_ICONS: Record<string, string> = {
  diwali: "diwali.png",
  deepavali: "diwali.png",
  pongal: "pongal.png",
  christmas: "christmas.png",
  "ayudha pooja": "ayudha-pooja.png",
  "ayutha pooja": "ayudha-pooja.png",
  "new year": "new-year.png",
  "independence day": "independence-day.png",
};

export const getFestivalIcon = (
  holidayName: string
): string | undefined => {
  const normalized = holidayName
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const matched = Object.entries(FESTIVAL_ICONS).find(
    ([name]) => normalized.includes(name)
  );

  return matched
    ? `/assets/festival-icons/${matched[1]}`
    : undefined;
};