import axios from "axios";
import { replace, type LoaderFunctionArgs } from "react-router";
import { verifyEmail } from "@/api/auth";
import { queryClient } from "@/lib/queryClient";

export type VerificationResult =
  "success" | "invalid" | "network-error" | "server-error";

async function startVerification(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  const attempt = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const operation = queryClient.fetchQuery<VerificationResult>({
    queryKey: ["email-verification", attempt],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
        await verifyEmail(token);
        // Refetch failures must not turn successful verification into failure.
        void queryClient
          .invalidateQueries({ queryKey: ["profile", "me"] })
          .catch(() => {});
        return "success";
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (!error.response) return "network-error";
          if (error.response.status === 400) return "invalid";
        }
        return "server-error";
      } finally {
        token = "";
      }
    },
  });
  // Also discard the captured token if an existing cached operation was reused.
  void operation
    .finally(() => {
      token = "";
    })
    .catch(() => {});
  return attempt;
}

export async function verificationLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (!url.searchParams.has("token")) return null;
  const token = url.searchParams.get("token") ?? "";
  if (!/^[a-f\d]{64}$/.test(token)) return replace("/verify-email");
  const attempt = await startVerification(token);
  // Replace the history entry before rendering; raw tokens never enter component
  // state or route-loader data. The fingerprint cannot verify an email itself.
  return replace(`/verify-email?attempt=${attempt}`);
}
