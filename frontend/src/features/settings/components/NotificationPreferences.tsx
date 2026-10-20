import { useId } from "react";
import { Switch } from "@base-ui/react/switch";
import { Bell, CalendarCheck, CalendarClock, Mail } from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  notificationKeys,
} from "@/api/notifications";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";

const options = [
  {
    key: "reminders",
    title: "Appointment Reminders",
    description: "Reminders before your upcoming consultations.",
    icon: CalendarClock,
  },
  {
    key: "updates",
    title: "Appointment Updates",
    description: "Updates about changes to your appointments.",
    icon: CalendarCheck,
  },
  {
    key: "promotional",
    title: "Promotional Emails",
    description: "News and optional offers from docvia.",
    icon: Mail,
  },
  {
    key: "system",
    title: "System Notifications",
    description: "General account and service updates.",
    icon: Bell,
  },
] as const;

export function NotificationPreferences() {
  const id = useId();
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = notificationKeys.preferences(user?._id ?? "");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getNotificationPreferences(signal),
    enabled: !!user,
    retry: false,
  });
  const save = useMutation({
    mutationFn: saveNotificationPreferences,
    retry: false,
    onSuccess: async (value) => {
      await client.cancelQueries({ queryKey, exact: true });
      client.setQueryData(queryKey, value);
    },
  });
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="min-w-0 rounded-xl bg-card p-5 shadow-card"
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold">
        Notification Preferences
      </h2>
      <div className="mt-2 divide-y divide-border">
        {options.map(({ key, title, description, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3 py-4">
            <Icon
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <label htmlFor={`${id}-${key}`} className="text-sm font-medium">
                {title}
              </label>
              {key !== "reminders" && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Coming soon
                </span>
              )}
              <p
                id={`${id}-${key}-description`}
                className="mt-1 text-xs leading-relaxed text-muted-foreground"
              >
                {description}
              </p>
            </div>
            <Switch.Root
              id={`${id}-${key}`}
              checked={
                key === "reminders"
                  ? (query.data?.appointmentReminders ?? false)
                  : false
              }
              disabled={
                key !== "reminders" ||
                !query.data ||
                query.isError ||
                save.isPending
              }
              onCheckedChange={(checked) => save.mutate(checked)}
              aria-describedby={`${id}-${key}-description${key === "system" ? ` ${id}-security-note` : ""}`}
              className="group data-disabled:cursor-not-allowed data-disabled:opacity-40 relative flex h-11 w-11 shrink-0 cursor-pointer items-center rounded-full before:absolute before:inset-x-0 before:top-2.5 before:h-6 before:rounded-full before:bg-muted before:ring-1 before:ring-border data-checked:before:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Switch.Thumb className="relative ml-0.5 size-5 rounded-full bg-white shadow-sm transition-transform group-data-checked:translate-x-5" />
            </Switch.Root>
          </div>
        ))}
      </div>
      {query.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading preferences...
        </p>
      )}
      {query.isError && (
        <p role="alert" className="text-sm text-destructive">
          Unable to load preferences.{" "}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </p>
      )}
      {save.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Saving...
        </p>
      )}
      {save.isSuccess && (
        <p role="status" className="text-sm text-success">
          Preference saved.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-sm text-destructive">
          Unable to confirm saving. Please retry or reload to check your saved
          preference.
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        More notification preferences are in development.
      </p>
      <p
        id={`${id}-security-note`}
        className="mt-2 text-xs leading-relaxed text-muted-foreground"
      >
        Critical account security emails cannot be disabled. This preference
        controls reminder emails only; in-app notifications remain enabled.
      </p>
    </section>
  );
}
