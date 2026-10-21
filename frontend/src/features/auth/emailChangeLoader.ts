import axios from "axios";
import { replace, type LoaderFunctionArgs } from "react-router";
import { confirmEmailChange } from "@/api/auth";
import { queryClient } from "@/lib/queryClient";

export type EmailChangeResult =
  "success" | "invalid" | "network-error" | "unavailable" | "server-error";

async function startConfirmation(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  const attempt = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const operation = queryClient.fetchQuery<EmailChangeResult>({
    queryKey: ["email-change-confirmation", attempt],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
        await confirmEmailChange(token);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (!error.response) return "network-error";
          if (error.response.status === 400) return "invalid";
          if (error.response.status === 409) return "unavailable";
        }
        return "server-error";
      } finally {
        token = "";
      }
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] !== "email-change-confirmation",
      });
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] !== "email-change-confirmation" &&
          !(query.queryKey[0] === "auth" && query.queryKey[1] === "me"),
      });
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.getMutationCache().clear();
      return "success";
    },
  });
  void operation
    .finally(() => {
      token = "";
    })
    .catch(() => {});
  return attempt;
}

export async function emailChangeLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (!url.searchParams.has("token")) return null;
  const token = url.searchParams.get("token") ?? "";
  if (!/^[a-f\d]{64}$/.test(token)) return replace("/confirm-email-change");
  const attempt = await startConfirmation(token);
  return replace(`/confirm-email-change?attempt=${attempt}`);
}
