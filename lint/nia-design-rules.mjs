// Nia's design rules (CLAUDE.md → Design), checked by `npm run lint`.
//
// The rules lived only in CLAUDE.md, so a slip showed up only when someone spotted it on screen.
// These checks read the Tailwind classes in our code, and each message names the rule a class
// breaks and what to use instead. The idea comes from Astryx, Meta's open-source design system,
// which checks its own rules the same way (docs/FEEDBACK.md, AX1).
//
// Errors are rules the code already follows everywhere, so a new slip fails `npm run lint`.
// Warnings are rules with older slips still in the code; those get cleaned up as each screen is
// next touched (CLAUDE.md → Progress, 0.2).

// A class inside a string: it starts the string or follows a space, a variant (`md:`) or `!`,
// and ends at a space or the end of the string.
const classes = (body) => new RegExp(String.raw`(?<=^|[\s:!])(?:${body})(?=$|\s)`, "g");

// Every string and template-string piece in a file (JSX text between tags isn't a string, so
// words people read on screen aren't checked).
function eachString(context, check) {
  return {
    Literal(node) {
      if (typeof node.value === "string") check(node, node.value);
    },
    TemplateElement(node) {
      check(node, node.value.cooked ?? node.value.raw);
    },
  };
}

// The element whose className a string sits in (`Button`, `h1`, `DialogTitle`), or null.
function classNameOwner(context, node) {
  const ancestors = context.sourceCode.getAncestors(node);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === "JSXAttribute") {
      if (a.name.name !== "className") return null;
      const el = a.parent.name;
      return el.type === "JSXMemberExpression" ? el.property.name : el.name;
    }
    if (a.type === "JSXElement" || a.type === "JSXFragment") return null;
  }
  return null;
}

function classRule({ description, pattern, message, where, hint }) {
  return {
    meta: { type: "suggestion", docs: { description }, messages: { broken: message }, schema: [] },
    create(context) {
      return eachString(context, (node, text) => {
        if (where && !where(context, node)) return;
        for (const match of text.matchAll(pattern)) {
          const cls = match[0];
          const tip = hint?.(cls);
          context.report({ node, messageId: "broken", data: { cls, hint: tip ? ` (${tip})` : "" } });
        }
      });
    },
  };
}

// --- What to use instead of a pixel value ---------------------------------------------------

const SPACING =
  /^-?(w|h|size|min-w|max-w|min-h|max-h|basis|p[xytrblse]?|m[xytrblse]?|gap(-[xy])?|space-[xy]|inset(-[xy])?|top|right|bottom|left|start|end|translate-[xy]|indent|scroll-[mp][xytrblse]?)$/;
const TEXT = { 32: "text-h1", 28: "text-h2", 24: "text-h3", 22: "text-subtitle", 15: "text-lead", 14: "text-sm", 13: "text-small", 12: "text-caption", 11: "text-micro", 10: "text-meta", 9: "text-tiny" };
const RADIUS = { 6: "sm", 8: "md", 12: "lg", 16: "xl", 22: "2xl" };

function pxHint(cls) {
  const m = /^(-?[\w-]+?)-\[(\d+(?:\.\d+)?)px\]$/.exec(cls);
  if (!m) return null;
  const [, prefix, n] = m;
  const px = Number(n);
  if (SPACING.test(prefix) && Number.isInteger(px)) {
    return `${prefix}-${px === 1 ? "px" : px / 4} is the same size`;
  }
  if (prefix === "text" && TEXT[px]) return `the theme size for ${px}px is ${TEXT[px]}`;
  const r = /^(rounded(?:-[trblse]{1,2})?)$/.exec(prefix);
  if (r && RADIUS[px]) return `${r[1]}-${RADIUS[px]} is the same`;
  return null;
}

// --- The rules ------------------------------------------------------------------------------

const isTitle = (name) => /^(h[1-4]|\w*Title)$/.test(name ?? "");

const rules = {
  "no-raw-px": classRule({
    description: "No pixel values in classes: sizes come from the theme",
    pattern: classes(String.raw`[\w-]*\[[^\]\s]*?\d*\.?\d+px[^\]\s]*\]`),
    message: "Nia rule: no pixel values in pages, use a theme size instead of {{cls}}{{hint}}.",
    hint: pxHint,
  }),

  "no-raw-color": classRule({
    description: "No hex or rgb colours in classes: colours come from the theme",
    pattern: classes(String.raw`[\w-]*\[(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch|oklab)\()[^\]\s]*\]`),
    message:
      "Nia rule: colours only from the theme (text-foreground, bg-muted, bg-nia-blue…), not {{cls}}.",
  }),

  "no-masonry": classRule({
    description: "Grids fill row by row: no CSS masonry columns",
    pattern: classes(String.raw`columns-(?:\d+|auto|3xs|2xs|xs|sm|md|lg|[2-7]?xl|\[[^\]\s]*\])`),
    message: "Nia rule: grids fill row by row from the left (use grid), not {{cls}} (Ika, 2026-11-11).",
  }),

  "button-pill": classRule({
    description: "Every button is a pill and every icon button a circle",
    pattern: classes(String.raw`rounded(?:-(?!full(?=$|\s))[^\s]+)?`),
    message: "Nia rule: buttons are pills and icon buttons circles, built into Button: remove {{cls}} (Ika, 2026-11-11).",
    where: (context, node) => classNameOwner(context, node) === "Button",
  }),

  "heading-style": {
    meta: {
      type: "suggestion",
      docs: { description: "One heading standard: text-h2 page titles, text-subtitle section headings" },
      messages: {
        weight: "Nia rule: no {{cls}}; titles and headings are font-semibold (Ika, 2026-11-10).",
        size: "Nia rule: a page title is text-h2 and a section heading text-subtitle, the same size on phones, not {{cls}} (Ika, 2026-11-10).",
      },
      schema: [],
    },
    create(context) {
      const weight = classes("font-extrabold|font-black");
      const size = classes(String.raw`text-display|(?:sm|md|lg|xl|2xl):text-(?:h\d|subtitle|display)`);
      return eachString(context, (node, text) => {
        for (const m of text.matchAll(weight)) {
          context.report({ node, messageId: "weight", data: { cls: m[0] } });
        }
        if (!isTitle(classNameOwner(context, node))) return;
        for (const m of text.matchAll(size)) {
          context.report({ node, messageId: "size", data: { cls: m[0] } });
        }
      });
    },
  },

  "geist-only": classRule({
    description: "Geist for all text: no serif, monospace or one-off font",
    pattern: classes(String.raw`font-(?:serif|mono|\[[^\]\s]*\])`),
    message: "Nia rule: Geist for all text, so no {{cls}} (Ika, 2026-10-19).",
  }),

  "sentence-case": classRule({
    description: "Text is sentence case: no all-caps",
    pattern: classes("uppercase"),
    message: "Nia rule: text is in sentence case, so no {{cls}} (Ika, 2026-10-19).",
  }),
};

export const niaDesignPlugin = { meta: { name: "nia" }, rules };

// The rules as they apply to Nia's code, for eslint.config.mjs.
export const niaDesignRules = [
  {
    files: ["src/**/*.{ts,tsx}"],
    // The component gallery (/dev/components, never on the live site) copies Figma frames as
    // they were drawn, some from before these rules.
    ignores: ["src/**/*.test.{ts,tsx}", "src/app/dev/**"],
    plugins: { nia: niaDesignPlugin },
    rules: {
      "nia/no-masonry": "error",
      "nia/geist-only": "error",
      "nia/sentence-case": "error",
      "nia/no-raw-color": "warn",
      "nia/button-pill": "warn",
      "nia/heading-style": "warn",
      "nia/no-raw-px": "warn",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "motion/react",
              message: "Nia rule: import from framer-motion and write m.div; motion/react loads the whole library on every page.",
            },
            {
              name: "framer-motion",
              importNames: ["motion"],
              message: "Nia rule: write m.div, not motion.div (MotionProvider loads the features after the page).",
            },
          ],
          patterns: [
            {
              group: ["react-icons", "react-icons/*", "@heroicons/*", "@radix-ui/react-icons", "@tabler/*", "@phosphor-icons/*", "phosphor-react"],
              message: "Nia rule: icons are Lucide only (lucide-react).",
            },
          ],
        },
      ],
    },
  },
  // The theme's own building blocks (shadcn) set exact sizes once, for every page that uses them,
  // and the calendar's days and the page numbers are square cells, not buttons people press.
  { files: ["src/components/ui/**"], rules: { "nia/no-raw-px": "off", "nia/button-pill": "off" } },
  // The screenplay preview's Courier capitals are content formatting, kept until Ika decides
  // (CLAUDE.md → Design). Invite codes are typed in capitals.
  {
    files: ["src/components/nia/script-preview.tsx"],
    rules: { "nia/geist-only": "off", "nia/sentence-case": "off" },
  },
  { files: ["src/components/nia/invite-code-form.tsx"], rules: { "nia/sentence-case": "off" } },
];
