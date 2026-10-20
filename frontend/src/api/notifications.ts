import { api } from "@/lib/axios";
export interface NotificationPreferences {
  appointmentReminders: boolean;
}
export interface AppNotification {
  _id: string;
  appointmentId?: string;
  type: "confirmation" | "cancellation" | "rescheduled" | "reminder";
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}
export const notificationKeys = {
  all: ["notifications"] as const,
  list: (id: string) => ["notifications", id, "list"] as const,
  count: (id: string) => ["notifications", id, "count"] as const,
  preferences: (id: string) => ["notification-preferences", id] as const,
};
export async function getNotificationPreferences(signal?: AbortSignal) {
  return (
    await api.get<NotificationPreferences>(
      "/users/me/notification-preferences",
      { withCredentials: true, signal },
    )
  ).data;
}
export async function saveNotificationPreferences(
  appointmentReminders: boolean,
) {
  return (
    await api.patch<NotificationPreferences>(
      "/users/me/notification-preferences",
      { appointmentReminders },
      { withCredentials: true },
    )
  ).data;
}
export async function getNotifications(signal?: AbortSignal) {
  return (
    await api.get<AppNotification[]>("/notifications", {
      withCredentials: true,
      signal,
    })
  ).data;
}
export async function getUnreadCount(signal?: AbortSignal) {
  return (
    await api.get<{ count: number }>("/notifications/unread-count", {
      withCredentials: true,
      signal,
    })
  ).data;
}
export async function markNotificationsRead(id?: string) {
  await api.patch(
    id
      ? `/notifications/${encodeURIComponent(id)}/read`
      : "/notifications/read-all",
    {},
    { withCredentials: true },
  );
}
