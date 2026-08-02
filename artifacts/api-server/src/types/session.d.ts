import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: "member" | "admin";
    contributionNumber?: string;
    username?: string;
    name?: string;
  }
}
