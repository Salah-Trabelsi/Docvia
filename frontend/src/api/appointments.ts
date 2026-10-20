import { api } from "@/lib/axios";
import type { DoctorClinic } from "@/features/doctors/types/apiDoctor.types";

export interface AppointmentDoctor {
  _id: string;
  firstName: string;
  lastName: string;
  slug?: string;
  specialty?: string;
  imageUrl?: string;
  clinic?: DoctorClinic;
}

export interface PatientAppointment {
  _id: string;
  doctorId: AppointmentDoctor | null;
  startsAt: string;
  endsAt: string;
  status: "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (userId: string) => ["appointments", userId, "list"] as const,
  detail: (userId: string, id: string) =>
    ["appointments", userId, "detail", id] as const,
};

export async function getMyAppointments(signal?: AbortSignal) {
  const { data } = await api.get<PatientAppointment[]>("/appointments/me", {
    withCredentials: true,
    signal,
  });
  return data;
}

export async function getAppointment(id: string, signal?: AbortSignal) {
  const { data } = await api.get<PatientAppointment>(
    `/appointments/${encodeURIComponent(id)}`,
    { withCredentials: true, signal },
  );
  return data;
}

export async function cancelAppointment(id: string) {
  const { data } = await api.patch<PatientAppointment>(
    `/appointments/${encodeURIComponent(id)}/cancel`,
    undefined,
    { withCredentials: true },
  );
  return data;
}

export async function rescheduleAppointment(id: string, startsAt: string) {
  const { data } = await api.patch<PatientAppointment>(
    `/appointments/${encodeURIComponent(id)}/reschedule`,
    { startsAt },
    { withCredentials: true },
  );
  return data;
}

export interface BookingInput {
  doctorId: string;
  startsAt: string;
  notes?: string;
}

export interface BookedAppointment {
  _id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: "confirmed";
  notes?: string;
}

export async function bookAppointment(input: BookingInput) {
  const { data } = await api.post<BookedAppointment>("/appointments", input, {
    withCredentials: true,
  });
  return data;
}
