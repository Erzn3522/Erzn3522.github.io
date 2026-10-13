// Visible text uses "to" for ranges: the CV's en dashes stay in the data, not on the page.
export const range = (period: string) => period.replace(/\s*[–—-]\s*/g, ' to ');

// "May 2023 – Dec 2023" → "2023"; "Apr 2025 – present" → "2025 to present"
export const years = (period: string) => {
  const [a, b] = period.replace(/[A-Z][a-z]{2} /g, '').split(/\s*[–—]\s*/);
  return !b || a === b ? a : `${a} to ${b}`;
};

export const startYear = (date: string) => date.match(/\d{4}/)?.[0] ?? date;
