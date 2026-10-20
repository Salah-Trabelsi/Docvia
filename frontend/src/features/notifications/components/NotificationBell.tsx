import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  notificationKeys,
} from "@/api/notifications";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const count = useQuery({
    queryKey: notificationKeys.count(user?._id ?? ""),
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: !!user,
    refetchInterval: 30_000,
    retry: false,
  });
  const list = useQuery({
    queryKey: notificationKeys.list(user?._id ?? ""),
    queryFn: ({ signal }) => getNotifications(signal),
    enabled: !!user && open,
    refetchInterval: 30_000,
    retry: false,
  });
  const read = useMutation({
    mutationFn: markNotificationsRead,
    retry: false,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          count.data?.count
            ? "Notifications: unread notifications"
            : "Notifications"
        }
        className="relative flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Bell aria-hidden="true" className="size-5" strokeWidth={1.6} />
        {!!count.data?.count && (
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 size-2 rounded-full bg-destructive"
          />
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 shadow-panel outline-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Popover.Title className="font-semibold">
                Notifications
              </Popover.Title>
              <Button
                size="sm"
                variant="ghost"
                disabled={!count.data?.count || read.isPending}
                onClick={() => read.mutate(undefined)}
              >
                Mark all read
              </Button>
            </div>
            <Popover.Description className="mt-1 text-xs text-muted-foreground">
              Recent appointment updates
            </Popover.Description>
            {list.isPending && (
              <p role="status" className="py-5 text-sm">
                Loading notifications...
              </p>
            )}
            {(list.isError || count.isError) && (
              <div role="alert" className="py-3 text-sm text-destructive">
                Unable to load notifications.{" "}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void list.refetch();
                    void count.refetch();
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
            {read.isError && (
              <p role="alert" className="py-2 text-sm text-destructive">
                Unable to mark notifications read. Please try again.
              </p>
            )}
            {list.isSuccess && !list.data.length && (
              <p className="py-6 text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
            <ul className="mt-2 max-h-[55dvh] overflow-y-auto divide-y divide-border">
              {list.data?.map((item) => (
                <li
                  key={item._id}
                  className={`py-3 text-sm ${!item.readAt ? "border-l-2 border-l-primary pl-3" : ""}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 break-words text-muted-foreground">
                    {item.message}
                  </p>
                  <time
                    dateTime={item.createdAt}
                    className="mt-1 block text-xs text-muted-foreground"
                  >
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.appointmentId && (
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <Link
                            to="/appointments"
                            onClick={() => setOpen(false)}
                          />
                        }
                      >
                        My Appointments
                      </Button>
                    )}
                    {!item.readAt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={read.isPending}
                        onClick={() => read.mutate(item._id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
