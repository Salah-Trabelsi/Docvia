import axios from "axios";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";

export function AppointmentLoadError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const location = useLocation();
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return (
    <div role="alert" className="space-y-3 rounded-xl bg-card p-5 text-sm">
      <p>
        {status === 401
          ? "Your session has expired. Please sign in again."
          : status === 404
            ? "This appointment is no longer available."
            : "Unable to load appointments. Please try again."}
      </p>
      {status === 401 ? (
        <Button
          nativeButton={false}
          render={<Link to="/login" state={{ from: location.pathname }} />}
        >
          Go to Login
        </Button>
      ) : (
        <Button variant="outline" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
