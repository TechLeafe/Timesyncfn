export const getBusinessYear = (
  date = new Date()
) => {
  const currentYear =
    date.getFullYear();

  const month =
    date.getMonth();

  // April onwards
  if (month >= 3) {
    return `${currentYear}-${currentYear + 1}`;
  }

  return `${currentYear - 1}-${currentYear}`;
};