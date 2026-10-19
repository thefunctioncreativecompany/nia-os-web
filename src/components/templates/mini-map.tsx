import { edgePath, layoutMap, type Workflow } from "@/lib/template-workflows";

// A tiny version of a workflow template's map, drawn from the same step data, in a
// frosted glass panel at the bottom right of its card.
export function MiniMap({ workflow }: { workflow: Workflow }) {
  const { pos, bands, W, H, node, margin } = layoutMap(workflow);
  return (
    <div aria-hidden className="h-21 w-33 rounded-lg border border-white/30 bg-white/15 p-2 backdrop-blur-md">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block size-full">
        {bands.map((b) => (
          <rect key={b.name} x={b.x} y={margin} width={b.w} height={H - margin * 2} rx={24} className="fill-white/10" />
        ))}
        {workflow.steps.flatMap((s) =>
          s.requires.map((r) => (
            <path
              key={`${r}-${s.n}`}
              d={edgePath(pos[r].x + node.w, pos[r].y + node.h / 2, pos[s.n].x, pos[s.n].y + node.h / 2)}
              fill="none"
              strokeWidth={7}
              className="stroke-white/55"
            />
          )),
        )}
        {workflow.steps.map((s) => (
          <rect key={s.n} x={pos[s.n].x} y={pos[s.n].y} width={node.w} height={node.h} rx={16} className={s.n === 1 ? "fill-white" : "fill-white/80"} />
        ))}
      </svg>
    </div>
  );
}
