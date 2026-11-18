
export type UserRole = "customer" | "vendor" | "admin";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}
