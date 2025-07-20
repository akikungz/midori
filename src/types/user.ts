export type UserRole = "admin" | "student" | "guest";

export type User = {
  name: string;
  email: string;
  role: UserRole;
}