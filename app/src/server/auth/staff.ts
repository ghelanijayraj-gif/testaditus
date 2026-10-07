import "server-only";
import { makeAuth } from "./factory";

export const {
  handlers: staffHandlers,
  auth: staffAuth,
  signIn: staffSignIn,
  signOut: staffSignOut,
  unstable_update: staffUpdateSession,
} = makeAuth("staff");
