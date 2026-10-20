import { useRef } from "react";
import axios from "axios";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { favoritesKey, getFavorites, updateFavorite } from "@/api/favorites";
import { useAuth } from "@/features/auth/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: favoritesKey(user?._id ?? ""),
    queryFn: ({ signal }) => getFavorites(signal),
    enabled: user?.role === "patient",
    staleTime: 30_000,
    retry: false,
  });
}

export function useDoctorFavorite(doctorId?: string) {
  const { user } = useAuth();
  const query = useFavorites();
  const client = useQueryClient();
  const submitting = useRef(false);
  const mutationKey = ["update-favorite", user?._id ?? ""];
  const pendingCount = useIsMutating({ mutationKey });
  const mutation = useMutation({
    mutationKey,
    mutationFn: (add: boolean) => updateFavorite(doctorId!, add),
    retry: false,
    onSuccess: async () => {
      // Refetch the canonical list rather than overwriting it with responses
      // from potentially concurrent changes in another tab.
      const queryKey = favoritesKey(user?._id ?? "");
      await client.cancelQueries({ queryKey, exact: true });
      await client.invalidateQueries({ queryKey, exact: true });
    },
  });
  const favorite = !!doctorId && !!query.data?.doctorIds.includes(doctorId);
  const disabled =
    !doctorId ||
    user?.role !== "patient" ||
    !query.isSuccess ||
    pendingCount > 0;
  const error = mutation.error ?? query.error;
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const errorMessage =
    status === 401
      ? "Please sign in again to manage favorites."
      : status === 404
        ? "This doctor is no longer available."
        : status === 403
          ? "Favorites are available to patients only."
          : error
            ? "Unable to load or save favorites. Please try again."
            : undefined;
  async function toggle() {
    if (
      disabled ||
      submitting.current ||
      client.isMutating({ mutationKey }) > 0
    )
      return;
    submitting.current = true;
    try {
      await mutation.mutateAsync(!favorite);
    } catch {
      /* Keep the saved state and show the request error. */
    } finally {
      submitting.current = false;
    }
  }
  return {
    favorite,
    disabled,
    errorMessage,
    toggle,
    retry: () => {
      mutation.reset();
      void query.refetch();
    },
  };
}
