import "server-only";
import { makeAuth } from "./factory";

export const { handlers: clientHandlers, auth: clientAuth, signIn: clientSignIn, signOut: clientSignOut } = makeAuth("client");
