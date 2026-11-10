// Turns "in design" templates into working ones (Ika, 2026-11-10: build the rest of the
// templates). Takes a JSON file of definitions and, for each, writes the template's schema
// (src/data/template-schemas.json: its sections and controls) and brings its manifest entry
// live (src/data/templates.manifest.json: description, group, help text). The help text
// (about, how to, questions) is written from the definition the same way for every template.
// Still by hand afterwards: add the code to READY (engine/sections.ts) and LAUNCHES (launches.ts).
//   node scripts/add-templates.mjs <definitions.json>
// A definition: { code, group, tags?, preview, alt?, stage?, related, contents, actions?, sections }
import fs from "node:fs";

const defs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const manifestFile = "src/data/templates.manifest.json";
const schemasFile = "src/data/template-schemas.json";
const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const schemas = JSON.parse(fs.readFileSync(schemasFile, "utf8"));

const list = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const label = (f) => (typeof f === "string" ? f : f.label);
const lower = (s) => s[0].toLowerCase() + s.slice(1);
const article = (s) => (/^[aeiou]/i.test(s) ? "an" : "a");

for (const d of defs) {
  const entry = manifest.templates.find((t) => t.code === d.code);
  if (!entry) throw new Error(`${d.code} isn't in the manifest`);
  if (!manifest.groups.includes(d.group)) throw new Error(`${d.code}: no group "${d.group}" (never invent one)`);
  for (const r of d.related) if (!manifest.templates.some((t) => t.code === r)) throw new Error(`${d.code}: related ${r} doesn't exist`);
  const name = entry.name;
  const roles = list(entry.icps);
  const stage = d.stage ?? entry.stage;
  const titles = d.sections.map((s) => s.title);
  const first = manifest.templates.find((t) => t.code === d.related[0]);
  const relatedNames = d.related.slice(0, 2).map((c) => manifest.templates.find((t) => t.code === c).name);
  const howTo = ["Open the template: it starts as a new draft in your project."];
  for (const s of d.sections.slice(0, 4)) {
    if (s.type === "fields") howTo.push(`Fill in ${s.title}: ${lower(list(s.fields.slice(0, 2).map(label)))}.`);
    else if (s.type === "table") howTo.push(`Add a row to ${s.title} for each entry, with ${list(s.columns.filter((c) => label(c) !== s.autonumber).slice(0, 3).map(label))}.`);
    else if (s.type === "checklist") howTo.push(`Tick off ${s.title} as you go; add or remove items to fit the job.`);
    else howTo.push(`Write the ${lower(s.title)}.`);
  }
  howTo.push("Download it as a PDF, or save it to the project for the team.");
  Object.assign(entry, {
    status: "live",
    label: "New template",
    stage,
    preview: d.preview,
    alt: d.alt ?? entry.alt,
    group: d.group,
    schema: d.code,
    tags: d.tags ?? [],
    related: d.related,
    details: {
      about: [d.preview, `Made for ${roles} roles. ${d.contents.slice(0, 2).join(". ")}.`, `It's laid out as ${list(titles)}.`],
      howTo,
      faq: [
        { q: `What is ${article(name)} ${name}?`, a: d.preview },
        { q: "Who is it for?", a: `Mainly ${roles}. It sits in ${d.group} and is used mainly in ${stage.toLowerCase()}.` },
        ...(first?.preview ? [{ q: `How is it different from ${first.name}?`, a: `${name} covers ${lower(d.preview.replace(/\.$/, ""))}. ${first.name} covers ${lower(first.preview.replace(/\.$/, ""))}. Many teams use both.` }] : []),
        { q: "Does it connect to my other documents?", a: `It lives in your project next to related templates like ${list(relatedNames)}, so the whole job stays in one place.` },
        ...(d.faq ?? []),
        { q: "Can I export it?", a: "Yes. Download it as a PDF to send or print." },
      ],
    },
  });
  const schema = { code: d.code, name, group: d.group, description: d.preview, contents: d.contents, builder: false, actions: d.actions ?? (d.sections.some((s) => s.type === "table") ? ["Add Row", "Print"] : ["Print"]), version: "v1.0", sections: d.sections, figma: {} };
  const at = schemas.templates.findIndex((t) => t.code === d.code);
  if (at >= 0) schemas.templates[at] = schema;
  else schemas.templates.push(schema);
  console.log(`${d.code} ${name}: ${d.sections.length} sections`);
}
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(schemasFile, JSON.stringify(schemas, null, 2) + "\n");
