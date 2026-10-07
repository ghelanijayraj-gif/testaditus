export function ProgressBar({ value = 0, color = "var(--sky)" }: { value?: number; color?: string }) {
  return (
    <div style={{ height: 3, background: "var(--mist)" }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div style={{ height: 3, width: Math.max(0, Math.min(1, value)) * 100 + "%", background: color, transition: "width .3s ease" }} />
    </div>
  );
}
