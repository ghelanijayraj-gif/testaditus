import { Archivo, Bowlby_One, Space_Mono } from "next/font/google";

// Same families as tokens/fonts.css, self-hosted through next/font.
export const display = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--font-bowlby", display: "swap" });
export const mono = Space_Mono({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-space-mono", display: "swap" });
export const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const fontVars = `${display.variable} ${mono.variable} ${sans.variable}`;
