export interface ProfileAccount {
  accountType: "Patient" | "Admin";
  memberSince: string;
  emailVerified: boolean;
  status: "Active" | "Inactive";
}
