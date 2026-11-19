import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import { niaDesignPlugin } from "./nia-design-rules.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});
const { rules } = niaDesignPlugin;
const broken = (n = 1) => Array.from({ length: n }, () => ({ messageId: "broken" }));

tester.run("no-raw-px", rules["no-raw-px"], {
  valid: [
    `<div className="w-85 md:px-page text-small" />`,
    `const size = "340px";`,
  ],
  invalid: [
    {
      code: `<div className="w-[340px]" />`,
      errors: [{ message: "Nia rule: no pixel values in pages, use a theme size instead of w-[340px] (w-85 is the same size)." }],
    },
    {
      code: `<p className={cn("md:text-[13px]", ok && "h-[1px]")} />`,
      errors: [
        { message: "Nia rule: no pixel values in pages, use a theme size instead of text-[13px] (the theme size for 13px is text-small)." },
        { message: "Nia rule: no pixel values in pages, use a theme size instead of h-[1px] (h-px is the same size)." },
      ],
    },
    { code: "const grid = `grid-cols-[240px_1fr] ${x}`;", errors: broken() },
  ],
});

tester.run("no-raw-color", rules["no-raw-color"], {
  valid: [
    `const swatches = [{ value: "#ffffff", label: "White" }];`,
    `<div className="[&_line[stroke='#ccc']]:stroke-border bg-nia-blue/50" />`,
  ],
  invalid: [
    { code: `<div className="bg-[#1a1a1a] text-[#3fb8b1]" />`, errors: broken(2) },
    { code: `<div className="bg-[rgba(26,26,26,0.4)]" />`, errors: broken() },
  ],
});

tester.run("no-masonry", rules["no-masonry"], {
  valid: [`<div className="grid grid-cols-3" />`],
  invalid: [{ code: `<div className="md:columns-3 gap-4" />`, errors: broken() }],
});

tester.run("button-pill", rules["button-pill"], {
  valid: [
    `<Button className="rounded-full" />`,
    `<div className="rounded-lg" />`,
    `<Button><span className="rounded-md" /></Button>`,
  ],
  invalid: [
    { code: `<Button className="h-auto rounded-lg p-3" />`, errors: broken() },
    { code: `<Button className={cn("shrink-0", "rounded-md")} />`, errors: broken() },
  ],
});

tester.run("heading-style", rules["heading-style"], {
  valid: [
    `<h1 className="text-h2 font-semibold tracking-tight text-foreground" />`,
    `<span className="text-display font-bold">$12</span>`,
  ],
  invalid: [
    { code: `<DialogTitle className="text-display font-semibold" />`, errors: [{ messageId: "size" }] },
    { code: `<h2 className="text-h3 md:text-h2" />`, errors: [{ messageId: "size" }] },
    { code: `<p className="text-micro font-extrabold" />`, errors: [{ messageId: "weight" }] },
  ],
});

tester.run("geist-only", rules["geist-only"], {
  valid: [`<p className="font-sans font-semibold" />`],
  invalid: [{ code: `<p className="font-mono" />`, errors: broken() }],
});

tester.run("sentence-case", rules["sentence-case"], {
  valid: [`<p className="normal-case placeholder:normal-case">Type in uppercase</p>`],
  invalid: [{ code: `<p className="text-micro uppercase tracking-wide" />`, errors: broken() }],
});
