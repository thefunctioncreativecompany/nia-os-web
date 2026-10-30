# Nia OS Design Program — learn it, apply it, feed it to Claude

**Purpose:** Learn how the best web apps are designed in 2026, intentionally design those lessons *into* Nia OS through an iterative process, and build a distilled knowledge base that gets fed to Claude inside the Nia app to shape its design intelligence — compounding a defensible moat while we build.

**How it works:**
1. Ika sends resources — videos, articles, modules, frameworks, UI kits, anything.
2. Each resource is logged in the curriculum and distilled: **the principles** (source-faithful) + **Nia OS application** (interpretation, clearly labeled).
3. Distilled principles enter the **priority queue** below, ranked by impact.
4. Each principle moves through the **practicability loop**: learn → decide → design in → build → validate → moat check.
5. Applied principles accumulate in the **moat record** — the running account of defensibility.

**Ground rules:**
- Distillations stay faithful to the source — no invented quotes or claims.
- Nia OS applications are clearly separated from source material.
- Everything stays DRAFT until Ika reviews; nothing here is final product direction.
- Status conventions — distillation: `queued` → `processing` → `distilled`; application: `not started` → `decided` → `designed` → `built` → `validated`.

---

## Priority queue — most impactful steps first

*Ranked by: product-defining weight × urgency for the MVP build × moat value. Re-rank as we learn.*

### P0 — decide now (shapes the MVP Symplenormics is building)

**1. Agency model: AI proposes → producer decides (004)**
The product-wide interaction rule for everything AI in nOS. The AI drafts the schedule, estimates the budget, suggests the crew — the producer approves. Human-in-control isn't ethics copy; it's the interface contract and the answer to every professional producer's #1 objection to AI tools. Decide this once, apply everywhere. *Moat: trust signature competitors don't have.*

**2. Deep-module decomposition of nOS workflows (001)**
Break production management into deep modules — scheduling, budgeting, crewing, assets, client comms — each doing a lot behind a simple interface (e.g., "generate call sheet" hides crew availability, locations, contacts). This is the system architecture; Symplenormics needs it before the build hardens. *Moat: the production-knowledge graph, encoded from lived studio experience.*

**3. Purpose audit: cut vanity UI (004)**
Every planned nOS screen must answer "what production job does this do?" Analytics-for-analytics'-sake dies here. Scope control before build = months saved. *Moat: focus; every competitor ships bloated.*

**4. Design-it-twice discipline (001)**
For every major workflow: two IA/prototype approaches, compare, then commit. Never the first idea. Already partially practiced in Figma — make it the rule. Cheap, immediate, applies to everything. *Moat: compound quality of decisions.*

### P1 — design in during MVP

**5. Shoot-day glanceable view (004)**
The make-or-break screen: readable at 6 AM on location, detail one tap away. Progressive disclosure as the field-work contract. *Moat: built for the field, not the demo.*

**6. Production-language IA pass (004)**
Replace software terms with production terms across the whole IA — call sheets, shot lists, wrap reports. Crews should read nOS like paperwork they already know, elevated. Cheap, high clarity payoff. *Moat: belonging; competitors speak SaaS.*

**7. Motion/interaction language (003)**
Define nOS's animation vocabulary — durations, curves, which transitions animate. On a shoot day, *feel* is trust: a responsive app gets believed, a laggy one gets abandoned. *Moat: felt quality AI-generated competitors won't invest in.*

**8. Define errors out of existence, per workflow (001)**
Prevent the error rather than handling it — e.g., scheduling layer prevents double-booking instead of building conflict-resolution UI. Applied workflow by workflow during the build. *Moat: the app competitors' users never have to fight.*

### P2 — craft & polish (beta)

**9. Haptic map for critical actions (003)** — "call sheet sent," "crew booked," "budget approved" land with tactile certainty on mobile. Map the 5–10 highest-stakes actions; silence everywhere else.

**10. Production-domain icon system (003)** — bespoke glyph set (camera, slate, call sheet, location), consistent stroke and rhythm, system-wide.

**11. Custom illustrations (003)** — empty states, onboarding, milestone moments in Function Studios' visual voice. No stock, ever.

**12. Wrap delight moment (004)** — when a project wraps: satisfying summary, shoot stats, something worth screenshotting. Earned, rare, memorable.

**13. Taste reference board (003)** — ongoing habit: the team studies best-in-class screens (Mobbin or equivalent); every design review starts from "what's the best version of this?"

---

## Explore models finished projects — the building-block model

*Ika, 2026-10-29. Status: decided. The unwritten rule behind Explore and the core features.*

**The rule:** every Explore title is a picture of a finished project. A user's project is the same picture with parts missing. Home, Templates and Projects are the building blocks that fill those parts in. As each layer is built, Explore should look more like what a team's own projects look like when they're done, so Explore always shows producers what "finished" means for work like theirs.

**Variables:** the parts every project has, finished or not, described with one shared list on both sides:

| Part | On a user's project | On an Explore title |
|---|---|---|
| Type, genres, frame shape | Details, deliverables | Type, genres, `aspect` / frame |
| Scale: shoot days, length, crew size, budget range | Details, Crew & talent, budget | Minutes or episodes, credits |
| Crew by role | Crew & talent (`CREW_ROLES`) | Credits (creator films), director and cast |
| Client and agency | Details | Brand, client, agency credits |
| Documents: call sheet, shot list, crew list, invoice… | Templates | Not yet: industry norms for the type (assumption below) |
| References | References, Inspiration | Tags, "You may also like" |
| Release: deliverables, press, where it lives | Deliverables, Files | Press kit, platform, recognition |

**The model:**
1. **Find its closest matches.** Score the project against Explore titles on the parts it has (`match.ts` already does this with tags, type, genres and frame).
2. **Picture the finished version.** Blend what its closest matches have, for example "commercials like this credited about 14 crew roles, 2 locations, 9:16 and 16:9 versions".
3. **Measure the gap.** The finished version minus what the project has now, part by part.
4. **Pick the next step.** Choose the building block (a template, a field) that closes the most of the gap, weighted by phase and days to the shoot, divided by the effort it takes.

**Constraints:** AI only proposes (Apply / Modify / Dismiss), never fills in a project by itself. Only templates that fully work can be suggested. Explore facts come from licensed or public sources only (Wikidata, TMDB's API, official channels), never scraped. A user's project never shapes anyone else's suggestions without their opt-in.

**Assumptions (test with the pilot):** a finished film's public facts (credits, length, release) are a fair stand-in for its production. We never see its real call sheets, so "the documents it would have had" comes from industry norms per production type. Producers will read "projects like yours had…" as a useful nudge, not as nagging.

**Limiting factors (today):** Explore reads files saved in the app's code, not Supabase. Most titles have no scale figures (crew size, shoot days). Creator films' crew comes from Instagram captions in 221 different role spellings. Only 9 templates work. With few users, taste data is thin, so tags and type carry the matching.

**Build order (core-features branch):**
1. **One shape for both.** A shared production profile that projects, Explore titles, press-kit films and creator films all read into, with credit roles mapped onto `CREW_ROLES`. From then on every new field is added to both sides. No screen changes, no migration.
2. **"Projects like this had…" on the project page.** The gap as a proposal card, each item opening the template or field that fills it. Needs a design in Figma first.
3. **Home shows the next step.** Each project's biggest gap, ordered by phase and shoot date (the phase-aware Home already planned).
4. **A finished project looks like an Explore page.** At wrap, a release kit shaped like a press kit; later, owners can opt in to show it on Explore under Latest projects.

*Moat: the gap model needs both halves, a library of finished work described in production terms and the tools that build a project, sharing one shape. A competitor with only one half can't copy it.*

---

## Practicability loop — learn → design in → moat

1. **Learn** — resource distilled (principles + Nia OS application).
2. **Decide** — Ika picks which principles get designed into nOS, and at what priority. Not everything applies; curation is the work.
3. **Design in** — the principle becomes a concrete design decision: a Figma change, a prototype, a spec for Symplenormics. Recorded in the distillation under "Designed into nOS."
4. **Build** — ships in the MVP/beta via the Symplenormics build.
5. **Validate** — pilot feedback confirms or kills it. Killed ideas are logged, not mourned.
6. **Moat check** — each applied principle gets a moat note: *why is this hard for a competitor to copy?* Accumulated in the moat record below.

---

## Curriculum — resource index

| # | Type | Title | Source | Distilled | Designed into nOS |
|---|------|-------|--------|-----------|-------------------|
| 001 | video | The Philosophy of Software Design – with John Ousterhout | The Pragmatic Engineer, YouTube, Apr 2025 | done | not started |
| 002 | video | Psychology Behind UI/UX Design (Harrish Murugesan) | TEDxUTA, YouTube | transcript pending | not started |
| 003 | video | How I Make Apps FEEL 10x Better (5 Design Secrets) | Chris Raroque (raroque), YouTube | done | not started |
| 004 | video | WWDC26: Principles of great design | Apple, YouTube | done | not started |

*Send the next resource as a link — videos, articles, modules, frameworks, kits all welcome.*

---

## Moat record — the running defensibility account

*Thesis: nOS's moat compounds from applied design principles — workflow decomposition competitors haven't done, craft they haven't invested in, creator-trust they haven't earned. No single feature; the accumulation.*

| # | Principle applied | Source | Why it's hard to copy | Status |
|---|-------------------|--------|----------------------|--------|
| — | *(empty — entries added as principles move through the loop)* | | | |

**Moat layers (working model):**
1. **Workflow decomposition** — the production-knowledge graph: how shoots actually run, encoded in deep modules. Requires lived production experience (Function Studios is the lab).
2. **Craft** — motion, haptics, illustration, iconography at a level AI-generated competitors won't invest in.
3. **Creator trust** — interfaces in production language, empathy-led, human-in-control AI; earned through pilots, not marketing.
4. **Data flywheel** (future) — 100+ projects of production data informing scheduling/budgeting intelligence. Only exists at scale; design for it now.

---

## Distillations

### 001 — The Philosophy of Software Design (John Ousterhout, Pragmatic Engineer)

**Source:** The Pragmatic Engineer podcast/video, Gergely Orosz interviewing Stanford professor John Ousterhout (author of *A Philosophy of Software Design*). Published Apr 9, 2025. ~80 min.
**Link:** https://youtu.be/lz451zUlF-k
**Note:** This episode is about *software* design (system architecture), not UI/visual design — but its principles map directly onto how Nia OS should be structured as a product and codebase. Flagged where the mapping is interpretation, not source.

**Part 1 — The principles (source-faithful):**

1. **Complexity is the enemy; everything else is commentary.** Ousterhout's über-principle: the only thing limiting what we can build is complexity — anything that makes a system hard to understand or modify. Complexity is incremental (lots of small things, never one big mistake) and nearly impossible to remove once it accumulates.
2. **Design is a decomposition problem.** The most important idea in computer science: break a large system into smaller units that can be implemented relatively independently.
3. **Deep modules beat shallow ones.** A deep module does a lot behind a simple interface — it hides complexity. Shallow modules (simple inside, complex interface) just move complexity around.
4. **Design it twice.** When Ousterhout designed the Tk toolkit API, the second design was clearly superior. Never go with your first idea — generate alternatives and compare.
5. **Define errors out of existence.** Rather than handling every error case, design so the error can't occur. (With the caution: don't just ignore necessary checks.)
6. **Comments are a design tool, not clutter.** He argues *for* comments — they document interfaces and explain intent. Writing the comment forces you to clarify the design.
7. **TDD works against high-level design** (his position): it forces detail-first thinking before the design is settled. Exception: writing a failing test first when fixing a bug is genuinely useful.
8. **Empathy is an undervalued design trait.** Design interfaces from the caller's perspective — what does the *user of the module* need?
9. **Some design upfront + design docs + design reviews.** Argue about the design on a whiteboard before building; get multiple viewpoints on tradeoffs. (Uber's design-doc culture cited as the working example.)
10. **AI coding tools are "tactical tornadoes" — which makes design MORE important.** AI churns out low-level code fast but can't do high-level design. As AI writes more code, design becomes a larger share of what developers do — and the durable human contribution.

**Part 2 — Nia OS application (interpretation):**

- **nOS is a decomposition problem.** "Fragmented creative workflows → connected, production-ready actions" is literally decomposition: scheduling, budgeting, crewing, asset management, client comms as deep modules behind simple interfaces. Each module should do a lot (e.g., "generate call sheet" hides crew availability, locations, contacts) while exposing almost nothing.
- **Design it twice → the Figma prototypes are already doing this.** Keep the discipline: for every major nOS workflow, prototype two IA approaches and compare before committing. Don't fall in love with the first prototype.
- **Define errors out of existence in the product, not just the code.** Example: prevent double-booking a crew member at the scheduling layer rather than building conflict-resolution UI. Every error state you design away is UX complexity the user never meets.
- **Empathy = design from the creator's perspective.** Their ICP (solo creative directors, photographers, small teams) is non-technical — interfaces must read like production language ("call sheet," "shoot day"), not software language. This is the product version of "consider the caller's perspective."
- **Design docs matter more with an external dev team.** Symplenormics is building the MVP — lightweight design docs and design reviews are how Ika keeps architectural control without writing the code. Ousterhout's whiteboard-argue-first maps directly onto her working relationship with Tokelo.
- **The AI moat argument.** Their positioning is "AI-native production OS." Ousterhout's point cuts both ways for them: AI will commoditize code generation (including competitors'), so nOS's durable advantage is its *design* — the workflow decomposition, the data model, the deep modules. That's the thing to get right while AI handles the typing.
- **Watch the complexity budget.** Marketplace + credits + subscriptions + AI features + studio tools = a lot of surface area. Every new nOS capability should be scored against the complexity it adds to the whole, not just its own value. Incremental complexity is how products become unmaintainable — for users and for the codebase.

**Part 3 — Designed into nOS:** *not started — awaiting Ika's decide step. Priority items from this source: #2 deep-module decomposition (P0), #4 design-it-twice (P0), #8 define-errors-out-of-existence (P1).*

**For the Claude feed (later synthesis):** *minimize total system complexity; prefer deep modules with simple interfaces; always generate a second design before committing; design errors out of existence; write the interface from the user's perspective; treat design — not code output — as the durable moat in the AI era.*

---

### 002 — Psychology Behind UI/UX Design (Harrish Murugesan, TEDxUTA)

**Source:** TEDxUTA talk. **Link:** https://youtu.be/fdXI9yznzz8
**Status:** transcript pending — distillation to follow.

---

### 003 — How I Make Apps FEEL 10x Better (5 Design Secrets) — Chris Raroque

**Source:** Chris Raroque (indie iOS developer — Mogul, Ellie, Luna, Lily), YouTube. Personal-experience tips plus study of top iOS apps.
**Link:** https://youtu.be/8mMH6Pq8qnE
**Note:** iOS-native video; web translations noted in the Nia OS section. Tip names/timestamps are source-faithful; elaborations of each tip are standard iOS craft practice, labeled as such.

**Part 1 — The principles (source-faithful):**

The thesis: apps don't win on *looks* alone — they win on *feel*. Five secrets:

1. **Interactions & animations.** Motion is feedback, not decoration. Responsive, physics-based animation makes an app feel alive and trustworthy; dead/stock transitions make it feel cheap. (Elaboration: spring curves, matched transitions, micro-interactions tied to touch.)
2. **Custom illustrations.** Bespoke illustration — empty states, onboarding, key moments — is brand. Stock visuals make every app feel the same.
3. **Haptic feedback.** Tactile confirmation of actions. Subtle, intentional vibration patterns that tell the user's hand what just happened. (Elaboration: selection/impact/notification patterns; restraint matters more than coverage.)
4. **Good icons.** The app icon and in-app iconography as a designed system — consistent stroke, rhythm, and meaning — rather than default glyphs.
5. **Elevate your design taste.** Taste is a trained skill: study the best apps relentlessly (he points to Mobbin, a UI reference library) until good judgment becomes instinct.

**Part 2 — Nia OS application (interpretation):**

- nOS is used **under time pressure on productions** — a shoot day is the worst place for a laggy-feeling app. *Feel* isn't polish here; it's trust. If the app feels sluggish while a producer is coordinating 20 people, they stop trusting it.
- **Haptics → confirm critical actions.** "Call sheet sent," "crew booked," "budget approved" should land with tactile certainty on mobile. Map the 5–10 highest-stakes actions to haptic patterns; everything else stays silent.
- **Custom illustrations → Function Studios' visual voice.** Empty states ("no projects yet"), onboarding for first-time producers, milestone moments (project wrapped) — this is where the studio's creative identity lives inside the product. No stock.
- **Icons → production-domain iconography.** Camera, slate, call sheet, location pin — a bespoke glyph set in production language, consistent system-wide.
- **Taste → build the reference habit.** A shared Mobbin board (or equivalent) for the team; every design review starts from "what's the best-in-class version of this screen?"
- **Web translation:** nOS is web-first. Motion → CSS/Framer Motion equivalents of spring physics; haptics → Vibration API on mobile web (limited — don't depend on it); illustrations and icon systems carry over 1:1.

**Part 3 — Designed into nOS:** *not started — awaiting Ika's decide step. Priority items from this source: #7 motion language (P1), #9 haptic map (P2), #10 icon system (P2), #11 illustrations (P2), #13 taste board (P2).*

**Moat note:** **Craft is uncopyable at speed.** AI-generated competitors ship default components with default motion. A deliberate motion language + bespoke illustration + production-domain iconography requires taste, time, and a creative studio behind it — Function Studios *is* that studio. This is moat layer 2 (Craft), and it's the most visible one: users feel it in the first 30 seconds.

---

### 004 — WWDC26: Principles of Great Design — Apple

**Source:** Apple, WWDC26 session. Eight first-party design principles with talk segments each.
**Link:** https://youtu.be/Xa9L2yx_QH8
**Related:** Human Interface Guidelines — Design principles (developer.apple.com/design)
**Note:** Principle names and order are source-faithful (from the talk's chapter marks). Definitions follow Apple's public design guidance.

**Part 1 — The principles (source-faithful):**

1. **Purpose** — Every element should serve a clear purpose. If it doesn't earn its place, remove it.
2. **Agency** — The user is in control. The app empowers; it doesn't dictate or obscure.
3. **Responsibility** — Design responsibly: respect the user's data, attention, and wellbeing. Don't exploit; don't nag.
4. **Familiarity** — Meet people where they are: platform conventions, existing mental models, language they already speak.
5. **Flexibility** — Adapt to different people, contexts, and abilities. One rigid path fails real users.
6. **Simplicity** — Say more with less. Progressive disclosure: glanceable surface, depth on demand.
7. **Craft** — Sweat the details. Precision in alignment, typography, motion, wording.
8. **Delight** — Earned moments of surprise and joy — never gimmicks, never at the cost of clarity.

**Part 2 — Nia OS application (interpretation):**

- **Purpose → kill vanity UI.** Every nOS screen must answer "what production job does this do?" Analytics-for-analytics'-sake dashboards are the first cut.
- **Agency → the AI positioning, stated as design.** nOS is "AI-native" — Agency is the guardrail: the AI *proposes* (schedule draft, budget estimate), the producer *decides*. Human-in-control AI isn't just ethics copy; it's the interaction model. This directly answers the trust question every AI product faces.
- **Responsibility → production data is sensitive.** Budgets, crew rates, client contacts. Handle with visible care; never nag, never dark-pattern the upsell.
- **Familiarity → speak production, not software.** Call sheets, shot lists, wrap reports — the interface should read like the paperwork crews already know, elevated. (Pairs with 001's "consider the caller's perspective.")
- **Flexibility → solo shooter to 20-person crew.** The same app must serve a one-person photography business and a small production team. Plus accessibility: long shoot days, bright sunlight, gloves — real-world contexts.
- **Simplicity → the shoot-day view.** Glanceable at 6 AM on location; detail one tap away. Progressive disclosure is the whole game for a tool used in the field.
- **Craft → converges with 003.** Same investment, same payoff.
- **Delight → wrap moments.** When a project wraps: a satisfying summary animation, the stats of the shoot, something worth screenshotting. Earned, rare, memorable.

**Part 3 — Designed into nOS:** *not started — awaiting Ika's decide step. Priority items from this source: #1 agency model (P0), #3 purpose audit (P0), #5 shoot-day view (P1), #6 language pass (P1), #12 wrap moment (P2).*

**Moat note:** **Agency-as-interaction-model is a trust moat.** Most AI-native tools either hide the AI's workings (black box) or dump raw output on the user. nOS's "AI proposes, producer decides" — applied consistently across every module — becomes a recognizable product signature and the answer to the #1 objection from professional producers. That's moat layer 3 (Creator trust), and it compounds: every validated human-in-control interaction deepens it.
