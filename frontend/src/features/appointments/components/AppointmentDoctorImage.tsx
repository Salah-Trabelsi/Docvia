import { useState } from "react";
import { UserRound } from "lucide-react";

export function AppointmentDoctorImage({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  const [failed, setFailed] = useState<string>();
  return src && failed !== src ? (
    <img
      src={src}
      alt={name}
      className="size-full rounded-[inherit] object-cover"
      onError={() => setFailed(src)}
    />
  ) : (
    <UserRound aria-hidden="true" className="size-6" />
  );
}
