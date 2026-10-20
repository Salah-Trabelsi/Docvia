import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import type { EmailChangeResult } from "../emailChangeLoader";

export function ConfirmEmailChangePage() {
  const [params] = useSearchParams();
  const confirmation = useQuery<EmailChangeResult>({
    queryKey: ["email-change-confirmation", params.get("attempt")],
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const loading = confirmation.fetchStatus === "fetching";
  const result = confirmation.data;
  const message = loading
    ? "Please wait while we confirm your new email address."
    : result === "success"
      ? "Email updated successfully. Please sign in with your new email address."
      : result === "network-error"
        ? "We could not confirm the result because of a connection problem. Try signing in with your new email, or check Settings before requesting another link."
        : result === "unavailable"
          ? "The new email address is no longer available. Request another email change from Settings."
          : result === "server-error" || confirmation.isError
            ? "We could not complete confirmation. Please try again later from Settings."
            : "This link is missing, invalid, expired or already used. Request a new confirmation link from Settings.";
  return (
    <AuthLayout>
      <div className="space-y-5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {loading
            ? "Confirming your email"
            : result === "success"
              ? "Email updated successfully"
              : "Email change confirmation"}
        </h1>
        <p
          role={loading || result === "success" ? "status" : "alert"}
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {message}
        </p>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          Go to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
