import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import { Mail } from "lucide-react";
import { forgotPassword, authErrorMessage } from "@/api/auth";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";

export function ForgotPasswordPage() {
  const submitting = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    defaultValues: { email: "" },
    mode: "onTouched",
  });
  const request = useMutation({ mutationFn: forgotPassword, retry: false });
  return (
    <AuthLayout>
      <div className="mb-7 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Enter your email address to request a password-reset link.
        </p>
      </div>
      <form
        noValidate
        aria-busy={request.isPending}
        className="space-y-5"
        onSubmit={(event) =>
          handleSubmit(async (values) => {
            if (submitting.current) return;
            submitting.current = true;
            try {
              await request.mutateAsync(values.email.trim().toLowerCase());
            } catch {
              /* Render the mutation error below. */
            } finally {
              submitting.current = false;
            }
          })(event)
        }
      >
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email</Label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-3.5 size-5 text-muted-foreground"
            />
            <Input
              id="recovery-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 pl-11"
              disabled={request.isPending}
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "recovery-email-error" : undefined
              }
              {...register("email", {
                required: "Email is required.",
                validate: (value) =>
                  (value.trim().length <= 254 &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) ||
                  "Enter a valid email address.",
              })}
            />
          </div>
          <FieldError id="recovery-email-error" errors={[errors.email]} />
        </div>
        <Button
          type="submit"
          disabled={request.isPending}
          className="h-12 w-full text-base"
        >
          {request.isPending ? "Sending request..." : "Send reset link"}
        </Button>
        {request.isSuccess && (
          <p
            role="status"
            className="rounded-lg bg-accent p-3 text-sm leading-relaxed text-accent-foreground"
          >
            {request.data.message}
          </p>
        )}
        {request.isError && (
          <FieldError>{authErrorMessage(request.error)}</FieldError>
        )}
      </form>
      <p className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-brand-foreground hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}
