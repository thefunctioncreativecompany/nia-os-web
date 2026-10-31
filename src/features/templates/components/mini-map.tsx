import { edgePath, layoutMap, type Workflow } from "@/lib/template-workflows";

// A tiny version of a workflow template's map, drawn from the same step data, in black
// on white at the bottom right of its Showcase card.
export function MiniMap({ workflow }: { workflow: Workflow }) {
  const { pos, bands, W, H, node, margin } = layoutMap(workflow);
  return (
    <span aria-hidden className="block h-21 w-33 rounded-lg border border-border bg-card p-2">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block size-full">
        {bands.map((b) => (
          <rect key={b.name} x={b.x} y={margin} width={b.w} height={H - margin * 2} rx={24} className="fill-foreground/3" />
        ))}
        {workflow.steps.flatMap((s) =>
          s.requires.map((r) => (
            <path
              key={`${r}-${s.n}`}
              d={edgePath(pos[r].x + node.w, pos[r].y + node.h / 2, pos[s.n].x, pos[s.n].y + node.h / 2)}
              fill="none"
              strokeWidth={7}
              className="stroke-foreground/45"
            />
          )),
        )}
        {workflow.steps.map((s) => (
          <rect key={s.n} x={pos[s.n].x} y={pos[s.n].y} width={node.w} height={node.h} rx={16} className={s.n === 1 ? "fill-foreground" : "fill-foreground/70"} />
        ))}
      </svg>
    </span>
  );
}
