/** CSS padlock (no emoji, no icon set): used beside "Who can see this". */
export function Lock({ size = 10, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <span aria-hidden style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", width: size, flex: "none" }}>
      <span style={{ width: size * 0.66, height: size * 0.5, border: `1.5px solid ${color}`, borderBottom: 0, borderRadius: `${size}px ${size}px 0 0` }} />
      <span style={{ width: size, height: size * 0.66, background: color }} />
    </span>
  );
}
