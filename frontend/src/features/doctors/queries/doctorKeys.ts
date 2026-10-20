export const doctorKeys = {
  list: ["doctors"] as const,
  mappedList: ["doctors", "mapped"] as const,
  detail: (slug?: string) => ["doctor", slug] as const,
  summary: ["doctor-availability-summary"] as const,
  calendar: (slug?: string, month?: string) =>
    slug === undefined
      ? (["doctor-calendar"] as const)
      : month === undefined
        ? (["doctor-calendar", slug] as const)
        : (["doctor-calendar", slug, month] as const),
  availability: (slug?: string) =>
    slug === undefined
      ? (["doctor-availability"] as const)
      : (["doctor-availability", slug] as const),
  slots: (slug: string, date?: string) =>
    ["doctor-availability", slug, date] as const,
};
