import type { PropsWithChildren } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  type LoginInput,
} from "@/api/auth";
import { AuthContext } from "../useAuth";

const currentUserKey = ["auth", "me"] as const;
const currentUserOptions = {
  queryKey: currentUserKey,
  queryFn: ({ signal }: { signal: AbortSignal }) => getCurrentUser(signal),
  retry: false,
  staleTime: 0,
};

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = useQuery({
    ...currentUserOptions,
    refetchOnWindowFocus: true,
  });
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      queryClient.setQueryData(currentUserKey, null);
    },
  });

  async function login(input: LoginInput) {
    await loginUser(input);
    await queryClient.cancelQueries();
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== "auth",
    });
    queryClient.setQueryData(currentUserKey, null);
    const user = await queryClient.fetchQuery(currentUserOptions);
    if (!user) throw new Error("Session cookie was not accepted");
  }

  return (
    <AuthContext.Provider
      value={{
        user: session.data,
        isLoading: session.isPending,
        isError: session.isError,
        isLoggingOut: logoutMutation.isPending,
        refresh: () => {
          void session.refetch();
        },
        login,
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
