import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "../useAuth";

export function ProtectedRoute() {
  const { user, isLoading, isError, refresh } = useAuth();
  const location = useLocation();
  if (isLoading)
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <p role="status">Checking your session...</p>
      </main>
    );
  if (isError)
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p role="alert">Unable to check your session. Please try again.</p>
        <Button onClick={refresh}>Try again</Button>
      </main>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  return <Outlet />;
}
