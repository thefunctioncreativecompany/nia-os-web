// Workflow templates: stages and steps, where each step says what it needs and what it
// hands on. The map (and the mini map on the template card) is drawn from this data, so
// new workflow templates need data, not new screens. Source: CDWorkspace prototype.

export type WorkflowStep = {
  n: number;
  label: string;
  stage: string;
  requires: number[];
  delivers: string;
  // Column inside its stage and row on the map, placed so no line crosses a card.
  map: { sub: number; row: number };
  description: string;
};

export type Workflow = { stages: string[]; steps: WorkflowStep[] };

export const WORKFLOWS: Record<string, Workflow> = {
  "t01-editorial-shoot": {
    stages: ["Blueprint", "Pre-production", "Shoot", "Safeguards"],
    steps: [
      { n: 1, label: "Vision", stage: "Blueprint", requires: [], delivers: "Direction statement", map: { sub: 0, row: 1 }, description: "The single direction every decision on this shoot answers to." },
      { n: 2, label: "Concept Blueprint", stage: "Blueprint", requires: [1], delivers: "Concept & deliverables", map: { sub: 1, row: 0 }, description: "The vision translated into a concept the team can build." },
      { n: 3, label: "Mood References", stage: "Blueprint", requires: [1], delivers: "Reference board", map: { sub: 1, row: 2 }, description: "The visual language: light, palette, styling, casting, place." },
      { n: 4, label: "Location Scouting", stage: "Pre-production", requires: [2, 3], delivers: "Confirmed location", map: { sub: 0, row: 0 }, description: "Shortlist, recce and confirm where the day happens." },
      { n: 5, label: "Talent Casting", stage: "Pre-production", requires: [2, 3], delivers: "Confirmed talent", map: { sub: 0, row: 1 }, description: "Who is in front of the camera, and when they are available." },
      { n: 6, label: "Styling & Wardrobe", stage: "Pre-production", requires: [3, 5], delivers: "Look list", map: { sub: 1, row: 2 }, description: "Looks, pulls, fittings and returns." },
      { n: 7, label: "Team Assembly", stage: "Pre-production", requires: [2], delivers: "Crew & call times", map: { sub: 0, row: 3 }, description: "Who is behind the camera, and when each person is called." },
      { n: 8, label: "Shot Planning", stage: "Shoot", requires: [4, 5, 6], delivers: "Shot list", map: { sub: 0, row: 1 }, description: "Every frame in order, with its location, cast, setup and running time." },
      { n: 9, label: "Callsheet Distribution", stage: "Shoot", requires: [7, 8], delivers: "Call sheet", map: { sub: 1, row: 2 }, description: "The day, compiled from the shot plan and the team." },
      { n: 10, label: "Contingency (Plan B)", stage: "Safeguards", requires: [8], delivers: "Plan B", map: { sub: 0, row: 0 }, description: "What happens if weather, talent or light falls through." },
      { n: 11, label: "Gear Inventory", stage: "Safeguards", requires: [8], delivers: "Kit list", map: { sub: 0, row: 2 }, description: "What's owned, rented, packed and backed up." },
    ],
  },
};

const MAP = { nodeW: 220, nodeH: 76, subW: 276, pad: 30, gap: 18, top: 92, rowGap: 128, margin: 24, bottom: 92 };

export function layoutMap(workflow: Workflow) {
  const rows = Math.max(...workflow.steps.map((s) => s.map.row)) + 1;
  const H = MAP.top + (rows - 1) * MAP.rowGap + MAP.nodeH + MAP.bottom;
  const pos: Record<number, { x: number; y: number }> = {};
  const bands: { name: string; x: number; w: number }[] = [];
  let x = MAP.margin;
  for (const name of workflow.stages) {
    const steps = workflow.steps.filter((s) => s.stage === name);
    const subs = Math.max(...steps.map((s) => s.map.sub)) + 1;
    const w = MAP.pad * 2 + (subs - 1) * MAP.subW + MAP.nodeW;
    bands.push({ name, x, w });
    for (const s of steps) pos[s.n] = { x: x + MAP.pad + s.map.sub * MAP.subW, y: MAP.top + s.map.row * MAP.rowGap };
    x += w + MAP.gap;
  }
  return { pos, bands, W: x - MAP.gap + MAP.margin, H, node: { w: MAP.nodeW, h: MAP.nodeH }, margin: MAP.margin };
}

// Right-angled connector with soft corners, bending just before the target card.
export function edgePath(x1: number, y1: number, x2: number, y2: number) {
  if (Math.abs(y2 - y1) < 1) return `M${x1},${y1} H${x2}`;
  const xm = x2 - 30;
  const r = Math.min(10, Math.abs(y2 - y1) / 2);
  const d = y2 > y1 ? 1 : -1;
  return `M${x1},${y1} H${xm - r} Q${xm},${y1} ${xm},${y1 + d * r} V${y2 - d * r} Q${xm},${y2} ${xm + r},${y2} H${x2}`;
}
