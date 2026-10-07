import type { CSSProperties } from "react";

/** Photo placeholder (static stand in for the source's <image-slot>). */
export function ImageSlot({ caption = "PHOTO", src, tone = "light", ratio, style }: { caption?: string; src?: string; tone?: "light" | "dark"; ratio?: string; style?: CSSProperties }) {
  const dark = tone === "dark";
  return (
    <div style={{ position: "relative", width: "100%", height: ratio ? undefined : "100%", aspectRatio: ratio, background: src ? "#000" : dark ? "rgba(255,255,255,.06)" : "var(--grey-50)", overflow: "hidden", ...style }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: dark ? "rgba(255,255,255,.6)" : "var(--grey-600)",
            backgroundImage: dark ? "none" : "repeating-linear-gradient(135deg,transparent 0 14px,rgba(16,24,40,.035) 14px 15px)",
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}
