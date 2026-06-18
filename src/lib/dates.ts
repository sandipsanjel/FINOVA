import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
  eachMonthOfInterval,
  isWithinInterval,
} from "date-fns";

export const todayISO = () => format(new Date(), "yyyy-MM-dd");

export const fmtDate = (iso: string, pattern = "dd MMM yyyy") => {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
};

export const fmtMonth = (iso: string) => fmtDate(iso, "MMM yyyy");

export function monthRange(ref = new Date()) {
  return { from: startOfMonth(ref), to: endOfMonth(ref) };
}
export function weekRange(ref = new Date()) {
  return { from: startOfWeek(ref, { weekStartsOn: 1 }), to: endOfWeek(ref, { weekStartsOn: 1 }) };
}
export function yearRange(ref = new Date()) {
  return { from: startOfYear(ref), to: endOfYear(ref) };
}

export function lastNMonths(n: number, ref = new Date()) {
  const end = endOfMonth(ref);
  const start = startOfMonth(subMonths(ref, n - 1));
  return eachMonthOfInterval({ start, end }).map((d) => ({
    key: format(d, "yyyy-MM"),
    label: format(d, "MMM"),
    start: startOfMonth(d),
    end: endOfMonth(d),
  }));
}

export function inRange(iso: string, from?: string, to?: string): boolean {
  const d = parseISO(iso);
  if (from && d < parseISO(from)) return false;
  if (to && d > parseISO(to)) return false;
  return true;
}

export {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  isWithinInterval,
};
