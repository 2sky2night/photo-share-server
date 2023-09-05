export enum Roles {
  Admin = "Admin",
  SuperAdmin = "SuperAdmin",
  User = "User"
}
export type Role = Roles
export const roles = [Roles.Admin, Roles.SuperAdmin, Roles.User]