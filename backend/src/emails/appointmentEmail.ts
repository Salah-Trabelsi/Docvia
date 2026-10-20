interface AppointmentEmailDetails {
  firstName: string;
  doctorName: string;
  specialty: string;
  startsAt: Date;
  endsAt: Date;
  clinicName?: string;
  clinicLocation?: string;
  appointmentsUrl: string;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

function appointmentEmail(
  details: AppointmentEmailDetails,
  cancelled: boolean,
  previous?: { previousStartsAt: Date; previousEndsAt: Date },
  reminder = false,
) {
  const date = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeZone: "Europe/Berlin",
  }).format(details.startsAt);
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });
  const time = `${clock.format(details.startsAt)} - ${clock.format(details.endsAt)} (Europe/Berlin)`;
  const title = reminder
    ? "Your appointment is tomorrow"
    : previous
      ? "Your appointment has been rescheduled"
      : cancelled
        ? "Your appointment has been cancelled"
        : "Your appointment is confirmed";
  const message = reminder
    ? "A reminder of your upcoming consultation. Please check the appointment details below."
    : previous
      ? "Your appointment time has been changed successfully. Please use the new date and time below."
      : cancelled
        ? "Your appointment has been cancelled. You can view your appointments or book another visit in Docvia."
        : "Your appointment has been booked successfully. We look forward to helping you prepare for your visit.";
  const rows = [
    ["Doctor", details.doctorName],
    ["Specialty", details.specialty || "Not specified"],
    ...(previous
      ? [
          [
            "Previous date",
            new Intl.DateTimeFormat("en-GB", {
              dateStyle: "full",
              timeZone: "Europe/Berlin",
            }).format(previous.previousStartsAt),
          ],
          [
            "Previous time",
            `${clock.format(previous.previousStartsAt)} - ${clock.format(previous.previousEndsAt)} (Europe/Berlin)`,
          ],
        ]
      : []),
    [previous ? "New date" : "Date", date],
    [previous ? "New time" : "Time", time],
    ["Clinic", details.clinicName || "Clinic information unavailable"],
    ["Location", details.clinicLocation || "Location information unavailable"],
  ];
  const url = escapeHtml(details.appointmentsUrl);
  return {
    subject: reminder
      ? "Docvia appointment reminder"
      : previous
        ? "Docvia appointment rescheduled"
        : cancelled
          ? "Docvia appointment cancellation"
          : "Docvia appointment confirmation",
    text: `Hello ${details.firstName},\n\n${title}.\n${message}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nView My Appointments:\n${details.appointmentsUrl}\n\nDocvia`,
    html: `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F8F4EE;font-family:Arial,Helvetica,sans-serif;color:#172433;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;">
<tr><td align="center" style="padding:28px;background:#F4E7D8;"><img src="https://res.cloudinary.com/dziigmgig/image/upload/v1792351119/docvia-logo.png" width="140" alt="Docvia" style="display:block;border:0;max-width:100%;"></td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.7;word-break:break-word;">
<h1 style="font-size:26px;line-height:1.3;">${title}</h1><p>Hello ${escapeHtml(details.firstName)},</p><p>${message}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF1E7;border-radius:12px;">${rows.map(([label, value]) => `<tr><td style="padding:10px 16px;font-size:14px;"><strong>${label}</strong><br>${escapeHtml(value)}</td></tr>`).join("")}</table>
<p style="text-align:center;margin:28px 0;"><a href="${url}" style="display:inline-block;padding:16px 24px;background:#D97732;color:#FFFFFF;border-radius:12px;text-decoration:none;font-weight:bold;">View My Appointments</a></p>
<p style="font-size:13px;color:#536176;">If the button does not work, open:</p><p style="font-size:13px;word-break:break-all;"><a href="${url}" style="color:#A34B18;">${url}</a></p>
</td></tr><tr><td align="center" style="padding:20px;background:#FFF8F2;font-size:12px;color:#536176;">Sent by Docvia</td></tr></table></td></tr></table></body></html>`,
  };
}

export function appointmentConfirmationEmail(details: AppointmentEmailDetails) {
  return appointmentEmail(details, false);
}
export function appointmentCancellationEmail(details: AppointmentEmailDetails) {
  return appointmentEmail(details, true);
}
export function appointmentRescheduledEmail(
  details: AppointmentEmailDetails & {
    previousStartsAt: Date;
    previousEndsAt: Date;
  },
) {
  return appointmentEmail(details, false, details);
}

export function appointmentReminderEmail(details: AppointmentEmailDetails) {
  return appointmentEmail(details, false, undefined, true);
}
