"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * "Preview as client" (staff) renders the real client views read only.
 * Client components call useReadOnly() and disable every action when true.
 * Server actions are safe regardless: they call requireClient(), which a staff
 * session can never pass.
 */
const Ctx = createContext(false);
export const ReadOnlyProvider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={true}>{children}</Ctx.Provider>;
export const useReadOnly = () => useContext(Ctx);
