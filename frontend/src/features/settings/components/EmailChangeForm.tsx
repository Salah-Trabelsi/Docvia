import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { requestEmailChange } from "@/api/auth";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

export function EmailChangeForm({ onSuccess }: { onSuccess: () => void }) {
  const id = useId();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const submitting = useRef(false);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<{ newEmail: string; currentPassword: string }>({
    defaultValues: { newEmail: "", currentPassword: "" },
    mode: "onTouched",
  });
  const mutation = useMutation({
    mutationFn: () => {
      const values = getValues();
      return requestEmailChange({
        newEmail: values.newEmail.trim().toLowerCase(),
        currentPassword: values.currentPassword,
      });
    },
    retry: false,
    gcTime: 0,
    onSuccess: () => {
      reset();
      onSuccess();
    },
  });
  return (
    <form
      noValidate
      aria-busy={mutation.isPending}
      className="space-y-4"
      onSubmit={(event) =>
        handleSubmit(async () => {
          if (submitting.current) return;
          submitting.current = true;
          try {
            await mutation.mutateAsync();
          } catch {
            /* Safe API message below. */
          } finally {
            submitting.current = false;
          }
        })(event)
      }
    >
      <div className="space-y-2">
        <Label htmlFor={`${id}-current`}>Current Email</Label>
        <Input
          id={`${id}-current`}
          value={user?.email ?? ""}
          readOnly
          className="min-h-11 bg-muted text-muted-foreground"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>New Email</Label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          disabled={mutation.isPending}
          className="min-h-11"
          aria-invalid={!!errors.newEmail}
          aria-describedby={errors.newEmail ? `${id}-email-error` : undefined}
          {...register("newEmail", {
            required: "Enter your new email address.",
            validate: (value) => {
              const normalized = value.trim().toLowerCase();
              if (
                normalized.length > 254 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
              )
                return "Enter a valid email address.";
              return (
                normalized !== user?.email.trim().toLowerCase() ||
                "Choose a different email address."
              );
            },
          })}
        />
        <FieldError id={`${id}-email-error`} errors={[errors.newEmail]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-password`}>Current Password</Label>
        <div className="relative">
          <Input
            id={`${id}-password`}
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            disabled={mutation.isPending}
            className="min-h-11 pr-12"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={
              errors.currentPassword ? `${id}-password-error` : undefined
            }
            {...register("currentPassword", {
              required: "Enter your current password.",
              validate: (value) =>
                (value.length >= 8 &&
                  new TextEncoder().encode(value).length <= 72) ||
                "Use at least 8 characters and at most 72 UTF-8 bytes.",
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={mutation.isPending}
            className="absolute top-0.5 right-0.5 size-10 text-muted-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        </div>
        <FieldError
          id={`${id}-password-error`}
          errors={[errors.currentPassword]}
        />
      </div>
      {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}
      <DialogFooter>
        <DialogClose
          disabled={mutation.isPending}
          render={
            <Button type="button" variant="outline" className="min-h-11" />
          }
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={mutation.isPending || !user}
          className="min-h-11"
        >
          {mutation.isPending ? "Sending confirmation..." : "Confirm New Email"}
        </Button>
      </DialogFooter>
    </form>
  );
}
