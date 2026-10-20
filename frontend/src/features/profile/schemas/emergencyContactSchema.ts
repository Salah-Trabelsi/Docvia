import { z } from "zod";
import { profileSchema } from "./profileSchema";

export const relationshipOptions = [
  "Spouse",
  "Partner",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Other",
] as const;

export const emergencyContactSchema = z
  .object({
    contactName: z.string().trim().max(100, "Use 100 characters or fewer."),
    relationship: z.string().trim().max(80, "Use 80 characters or fewer."),
    phone: profileSchema.shape.phone.refine(
      (value) => value.length <= 40,
      "Use 40 characters or fewer.",
    ),
  })
  .superRefine((contact, context) => {
    if (!contact.contactName && !contact.relationship && !contact.phone) return;
    if (!contact.contactName)
      context.addIssue({
        code: "custom",
        path: ["contactName"],
        message: "Enter the contact name.",
      });
    if (!contact.relationship)
      context.addIssue({
        code: "custom",
        path: ["relationship"],
        message: "Choose a relationship.",
      });
    if (!contact.phone)
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a contact phone number.",
      });
  });

export type EmergencyContactValues = z.infer<typeof emergencyContactSchema>;
