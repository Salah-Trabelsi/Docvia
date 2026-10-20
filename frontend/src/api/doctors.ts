import type { ApiDoctor } from "@/features/doctors/types/apiDoctor.types";
import { doctorKeys } from "@/features/doctors/queries/doctorKeys";
import { api } from "../lib/axios";

export interface DoctorAvailabilitySummary {
  doctorId: string;
  slug?: string;
  nextAvailableDate: string | null;
}

export const doctorAvailabilitySummaryKey = doctorKeys.summary;

export async function getDoctorAvailabilitySummary(signal?: AbortSignal) {
  const { data } = await api.get<DoctorAvailabilitySummary[]>(
    "/doctors/availability-summary",
    { signal },
  );
  return data;
}

export interface DoctorCalendarResponse {
  month: string;
  timeZone: string;
  days: { date: string; available: boolean }[];
}

export interface DoctorAvailabilityResponse {
  date: string;
  timeZone: string;
  slots: { startAt: string; endAt: string }[];
}

export async function getDoctorCalendar(
  slug: string,
  month: string,
  signal?: AbortSignal,
) {
  const { data } = await api.get<DoctorCalendarResponse>(
    `/doctors/${encodeURIComponent(slug)}/calendar`,
    { params: { month }, signal },
  );
  return data;
}

export async function getDoctorAvailability(
  slug: string,
  date: string,
  signal?: AbortSignal,
) {
  const { data } = await api.get<DoctorAvailabilityResponse>(
    `/doctors/${encodeURIComponent(slug)}/availability`,
    { params: { date }, signal },
  );
  return data;
}

export const getDoctorBySlug = async (slug: string) => {
  const { data } = await api.get<ApiDoctor>(`/doctors/${slug}`);
  return data;
};

export const getDoctors = async () => {
  const { data } = await api.get<ApiDoctor[]>("/doctors");
  return data;
};
