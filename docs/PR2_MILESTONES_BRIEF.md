# Design brief: Key milestones (PR2)

Paste everything below the line into Claude Design. When the design is done, reconcile it into
Figma (file `jaF49U0T0DQ5lNB6h4wJvp`), then it gets built from that.

---

## What this is

Nia OS is a production office for photographers, filmmakers, content creators and small studios.
Every project has **Key milestones**: a short list of goals and to-dos for the production. Today it's
a section on the project's Overview: one line to add an item, then open items listed by date (overdue
in red, milestones flagged), a tick to mark one done (done items fold away under "Done"), and editing
the words or the date in place. Items also arrive from meeting notes ("send action items to
milestones").

Producers need to know **who is doing what, by when**. Design the next version.

## Each item has

- **Kind**: Milestone (a goal or a date that matters, e.g. "Picture lock") or Action (something to
  do, e.g. "Send call sheet to talent").
- **Title** (required) and **date** (optional).
- **Assignee** (new, optional): one person from this project's cast & crew, shown with their initials
  (or their photo if they have a Nia account) and name.
- **Department** (new, optional): Direction, Production, Camera & lighting, Art & set, Wardrobe, hair
  & make-up, Sound, Post-production, Other.
- **Priority** (new, optional): High, Medium, Low.
- **Stage** (new, optional): Development, Pre-production, In production, Post-production, Wrapped.
- **Notes** (new, optional): more detail, a few sentences.
- **Done** or open.

## Design these

1. **The Overview section (compact).** Stays short and calm. Each row: tick, title, then the
   **assignee next to the date**. Department, priority, stage and notes don't show here. One way in
   to the full view (a grey "View all" pill with an arrow, Nia's `ViewAll`).
2. **The full-screen view.** Every item with all its fields. Producers scan it by date and by who.
   Show department, priority and stage without making it a spreadsheet. Decide whether you can
   group or filter (for example by assignee or stage), and keep it to one way of doing each thing.
3. **Adding an item.** Still one quick line (type and press Enter). **Typing a crew member's name in
   the title assigns it to them automatically**: "Send call sheet to Maya" assigns Maya. Show how
   that looks as you type (the name recognised, a suggestion if two people share a first name) and
   how to undo it if it guessed wrong.
4. **Editing an item.** Where the assignee, department, priority, stage and notes are set and
   changed (a side panel, a pop-up, or in the row: your call).
5. **Reordering.** Drag an item to a new place in the list. Show the drag handle, the item being
   dragged and where it will land. Keyboard users need a way too (e.g. move up/down).

## States to include

- Empty project (no items yet), a long list (30+), loading, and couldn't-save.
- Overdue, due today, done.
- Someone who can only view the project: they see everything but can't change anything.
- An assignee who has since been removed from the project's cast & crew.
- No cast & crew yet: what assigning looks like when there's nobody to assign.

## Nia's look (must follow)

- Neutral greys; **Nia Blue** (`#005FB8` light / `#3794FF` dark) only for active states and the one
  main button. **At most one blue button per screen**; every other button is grey.
- Every button is a **pill**, every icon button a **circle**.
- **Geist** for all text, **sentence case** everywhere (no all-caps labels).
- Page title: 28px semibold; section heading: 22px semibold. Same sizes on phones.
- Light and dark mode.
- **Few words**: a title per section, no explaining lines unless someone would be stuck without one.
- **Minimal**: remove before adding; detail on demand, not all at once.
- Production language: milestone, action, crew, call sheet, shoot day, wrap.
- Desktop first (1440px wide); phones come in a later pass.

## Not in this design

Kanban boards, calendar views and dependencies between items: maybe later, not now.
