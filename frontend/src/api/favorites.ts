import { api } from "@/lib/axios";
export interface Favorites {
  doctorIds: string[];
}
export const favoritesKey = (userId: string) => ["favorites", userId] as const;
export async function getFavorites(signal?: AbortSignal) {
  return (
    await api.get<Favorites>("/users/me/favorites", {
      withCredentials: true,
      signal,
    })
  ).data;
}
export async function updateFavorite(doctorId: string, add: boolean) {
  const url = `/users/me/favorites/${encodeURIComponent(doctorId)}`;
  return add
    ? (await api.post<Favorites>(url, undefined, { withCredentials: true }))
        .data
    : (await api.delete<Favorites>(url, { withCredentials: true })).data;
}
