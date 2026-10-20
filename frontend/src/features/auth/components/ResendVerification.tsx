import { useEffect, useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { resendVerification } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";

export function ResendVerification({ email }: { email?: string }) {
  const id = useId();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now);
  const address = (email ?? input).trim().toLowerCase();
  const client = useQueryClient();
  const cooldownKey = ["verification-cooldown", address];
  const { data: until = 0 } = useQuery<number>({
    queryKey: cooldownKey,
    queryFn: () => client.getQueryData<number>(cooldownKey) ?? 0,
    enabled: false,
    initialData: 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const seconds = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const mutation = useMutation({
    mutationFn: resendVerification,
    retry: false,
    onSuccess: (result) => setMessage(result.message),
    onError: (failure) => {
      if (axios.isAxiosError(failure) && failure.response?.status === 429) {
        const retryAfter = Number(failure.response.headers["retry-after"]);
        client.setQueryData(
          cooldownKey,
          Date.now() +
            Math.max(60, Number.isFinite(retryAfter) ? retryAfter : 60) * 1000,
        );
        setError("Too many requests. Please wait before trying again.");
      } else {
        setError("Unable to submit your request. Please try again later.");
      }
    },
  });

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (mutation.isPending || until > Date.now()) return;
        setMessage("");
        setError("");
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ||
          address.length > 254
        ) {
          setError("Enter a valid email address.");
          return;
        }
        setNow(Date.now());
        client.setQueryData(cooldownKey, Date.now() + 60_000);
        mutation.mutate(address);
      }}
    >
      {!email && (
        <div className="space-y-2">
          <Label htmlFor={id}>Email address</Label>
          <Input
            id={id}
            type="email"
            autoComplete="email"
            value={input}
            disabled={mutation.isPending}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
              setMessage("");
            }}
            className="min-h-11"
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
      )}
      <Button
        type="submit"
        variant="outline"
        disabled={mutation.isPending || seconds > 0}
        className="h-auto min-h-11 w-full whitespace-normal"
      >
        {mutation.isPending
          ? "Sending request..."
          : seconds > 0
            ? `Resend available in ${seconds}s`
            : "Resend verification email"}
      </Button>
      {message && (
        <p
          role="status"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {message}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </form>
  );
}
