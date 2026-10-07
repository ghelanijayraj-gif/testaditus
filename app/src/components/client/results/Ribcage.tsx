/** 05 Breath visual: ribcage with three tape levels (prototype lines 1397–1411). Arrows grow 6 + 5 per cm. */
export function Ribcage({ selected, u, l, b, id }: { selected: string | null; u: number; l: number; b: number; id: string }) {
  const line = (k: string, d: string, on: boolean, dash?: boolean) => (
    <path key={k} d={d} style={{ fill: "none", stroke: on ? "#006DE0" : "#98A2B3", strokeWidth: on ? 3 : 1.5, strokeDasharray: dash ? "4 4" : undefined, strokeLinecap: "round", transition: "stroke .25s" }} />
  );
  const ribs = [];
  for (let i = 0; i < 7; i++) {
    const y = 70 + i * 28,
      up = i < 3,
      on = (up && selected === "ribsUpper") || (!up && selected === "ribs"),
      sp = 62 + i * 4;
    ribs.push(line("l" + i, `M146 ${y} Q ${150 - sp} ${y - 6} ${150 - sp - 8} ${y + 26}`, on), line("r" + i, `M154 ${y} Q ${150 + sp} ${y - 6} ${150 + sp + 8} ${y + 26}`, on));
  }
  const L = (v: number) => 6 + v * 5;
  const mid = `ah-${id}`;
  const arrow = (k: string, x: number, y: number, len: number, dir: number) => <line key={k} x1={x} y1={y} x2={x + dir * len} y2={y} style={{ stroke: "#101828", strokeWidth: 2 }} markerEnd={`url(#${mid})`} />;
  const t = (k: string, x: number, y: number, txt: string) => (
    <text key={k} x={x} y={y} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#101828", letterSpacing: ".06em" }}>
      {txt}
    </text>
  );
  return (
    <svg viewBox="0 0 300 320" role="img" aria-label="Ribcage with tape measures at the upper ribs, lower ribs and back" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <marker id={mid} viewBox="0 0 8 8" refX={6} refY={4} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" style={{ fill: "#101828" }} />
        </marker>
      </defs>
      <path d="M150 30 C110 30 78 46 70 80 C60 130 62 200 76 250 C86 284 112 300 150 300 C188 300 214 284 224 250 C238 200 240 130 230 80 C222 46 190 30 150 30 Z" style={{ fill: "#F7F8FA", stroke: "#D0D5DD", strokeWidth: 1.5 }} />
      <line x1={150} x2={150} y1={60} y2={170} style={{ stroke: "#D0D5DD", strokeWidth: 6, strokeLinecap: "round" }} />
      {ribs}
      {line("back", "M96 236 Q150 272 204 236", selected === "ribsBack", true)}
      {arrow("au1", 72, 104, L(u), -1)}
      {arrow("au2", 228, 104, L(u), 1)}
      {arrow("al1", 74, 214, L(l), -1)}
      {arrow("al2", 226, 214, L(l), 1)}
      <line x1={150} y1={262} x2={150} y2={262 + L(b)} style={{ stroke: "#101828", strokeWidth: 2 }} markerEnd={`url(#${mid})`} />
      {t("t1", 150, 20, "01 UPPER RIBS")}
      {t("t2", 150, 196, "02 LOWER RIBS")}
      {t("t3", 150, 316, "03 BACK")}
    </svg>
  );
}
