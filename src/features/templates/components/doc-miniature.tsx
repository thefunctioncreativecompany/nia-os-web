import { cn } from "@/lib/utils";
import { edgePath, layoutMap, type Workflow } from "@/lib/template-workflows";
import type { TemplatePreview } from "@/features/templates/actions";
import type { Section } from "@/features/templates/types";
import { fieldLabel } from "@/features/templates/engine/sections";
import { FlatIcon } from "@/features/templates/components/flat-icon";

type Schema = NonNullable<TemplatePreview["schema"]>;

// The preview pop-up's picture (prototype DocMiniature): a miniature of the real editor
// drawn from the template's schema, or the workflow map for workflow templates.
export function DocMiniature({ icon, schema, workflow, name }: { icon: string; schema: Schema | null; workflow?: Workflow; name: string }) {
  if (workflow) return <WorkflowMap workflow={workflow} name={name} />;
  if (!schema) return <FlatIcon name={icon} size="xl" className="opacity-30" />;
  const sections = schema.sections.slice(0, schema.builder ? 4 : 5);
  return (
    <div aria-hidden className="flex size-[86%] gap-4.5">
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-card px-5.5 py-4.5">
        <p className="truncate text-tiny text-muted-foreground">{schema.group}</p>
        <p className="mt-1 truncate text-h3 leading-tight font-semibold text-foreground">{schema.name}</p>
        <div className="mt-2 mb-1 flex flex-wrap gap-1.25 border-b-[1.5px] border-foreground pb-2">
          {["Undo", "Redo", ...schema.actions].slice(0, 5).map((a) => (
            <span key={a} className="rounded-full border border-border px-1.75 py-px text-tiny whitespace-nowrap text-foreground/80">{a}</span>
          ))}
        </div>
        {sections.map((s, i) => <MiniSection key={i} section={s} />)}
      </div>
      <div className="hidden w-[27%] flex-col gap-2 rounded-lg border border-border bg-card p-3.5 sm:flex">
        <div className="flex justify-between">
          <span className="text-tiny text-muted-foreground">Preview</span>
          <span className="rounded-full border border-foreground px-1.25 text-tiny">Draft</span>
        </div>
        <div className="flex h-[34%] items-center justify-center rounded-md bg-secondary">
          <FlatIcon name={icon} size="md" />
        </div>
        <Bar className="h-1.25 w-3/5 bg-foreground" />
        <Bar className="w-[95%]" />
        <Bar className="w-[85%]" />
        <Bar className="w-[70%]" />
        <div className="flex-1" />
        <div className="flex gap-1.25">
          <span className="h-3.5 flex-1 rounded-full border border-border" />
          <span className="h-3.5 w-[38%] rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}

function Bar({ className }: { className?: string }) {
  return <span className={cn("block h-0.5 rounded-xs bg-foreground/12", className)} />;
}

function Label({ children }: { children: string }) {
  return <span className="mb-0.75 block truncate text-tiny text-muted-foreground">{children}</span>;
}

function MiniSection({ section: s }: { section: Section }) {
  let body: React.ReactNode;
  if (s.type === "fields" || s.type === "metrics" || s.type === "categories") {
    const items = s.type === "fields" ? s.fields.map(fieldLabel) : s.items;
    body = (
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.75">
        {items.slice(0, 9).map((f) => (
          <div key={f} className="min-w-0">
            <Label>{f}</Label>
            <Bar className="h-px bg-foreground/20" />
          </div>
        ))}
      </div>
    );
  } else if (s.type === "table" || s.type === "budget") {
    const cols = s.type === "table" ? s.columns.map(fieldLabel) : ["Category", "Description", "Rate", "Units", "Subtotal"];
    const grid = { gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` };
    body = (
      <div className="rounded-xs border border-foreground/14">
        <div className="grid bg-secondary" style={grid}>
          {cols.map((c) => <span key={c} className="truncate border-r border-foreground/8 px-1.25 py-1 text-tiny text-muted-foreground">{c}</span>)}
        </div>
        {[0, 1, 2].map((r) => (
          <div key={r} className="grid h-2.75 border-t border-foreground/8" style={grid}>
            {cols.map((c) => <span key={c} className="border-r border-foreground/6" />)}
          </div>
        ))}
      </div>
    );
  } else if (s.type === "frames") {
    body = (
      <div className="grid grid-cols-3 gap-1.75">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="aspect-video rounded-xs border border-dashed border-foreground/25" />
            <Bar className="mt-1 h-px bg-foreground/20" />
          </div>
        ))}
      </div>
    );
  } else if (s.type === "cards") {
    body = (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-sm border border-foreground/14 p-1.75">
            <Bar className="h-1 w-[55%] bg-foreground" />
            <Bar className="mt-1.5 h-3.5 bg-secondary" />
            <Bar className="mt-1.5 h-px w-[70%] bg-foreground/20" />
          </div>
        ))}
      </div>
    );
  } else if (s.type === "checklist") {
    body = (
      <div className="grid grid-cols-3 gap-2.5">
        {s.groups.map((g) => (
          <div key={g.label}>
            <Label>{g.label}</Label>
            {g.items.slice(0, 2).map((it) => (
              <div key={it} className="mb-0.75 flex items-center gap-1">
                <span className="size-1.5 rounded-xs border border-foreground" />
                <Bar className="h-px w-4/5 bg-foreground/25" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="rounded-sm border border-foreground/14 p-1.75">
        <Bar className="w-[90%]" />
        <Bar className="mt-1.25 w-3/4" />
        <Bar className="mt-1.25 w-2/5" />
      </div>
    );
  }
  return (
    <div className="mt-3.5">
      <p className="mb-1.75 truncate text-micro font-extrabold text-foreground">{s.title}</p>
      {body}
    </div>
  );
}

function WorkflowMap({ workflow, name }: { workflow: Workflow; name: string }) {
  const { pos, bands, W, H, node, margin } = layoutMap(workflow);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${name} workflow map`} className="block h-[84%] w-[88%]">
      {bands.map((b) => (
        <g key={b.name}>
          <rect x={b.x} y={margin} width={b.w} height={H - margin * 2} rx={20} className="fill-white stroke-foreground/12" />
          <text x={b.x + 18} y={H - margin - 18} fontSize={15} className="fill-foreground/50">{b.name}</text>
        </g>
      ))}
      {workflow.steps.flatMap((s) =>
        s.requires.map((r) => (
          <path key={`${r}-${s.n}`} d={edgePath(pos[r].x + node.w, pos[r].y + node.h / 2, pos[s.n].x, pos[s.n].y + node.h / 2)} fill="none" strokeWidth={2} className="stroke-foreground/35" />
        )),
      )}
      {workflow.steps.map((s) => (
        <g key={s.n}>
          <rect x={pos[s.n].x} y={pos[s.n].y} width={node.w} height={node.h} rx={14} strokeWidth={1.5} className="fill-white stroke-foreground/20" />
          <text x={pos[s.n].x + 18} y={pos[s.n].y + 44} fontSize={17} fontWeight={600} className="fill-foreground">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}
