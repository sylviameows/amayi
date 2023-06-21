import { Session } from "express-session";

declare module "express-session" {
  interface SessionData {
    backURL: string | undefined | null
  }
}