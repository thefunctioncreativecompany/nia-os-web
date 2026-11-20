# Meetings: Google Meet, Gemini notes and uploaded notes (future build)

Outlined 2026-11-18 with Ika. Step 1 live 2026-11-18 (`20261120000000_meetings.sql` run; 14 access checks with two accounts pass). Step 2 built 2026-11-18 and switched off: `20261121000000_meeting_proposals.sql` is run, but there's no `ANTHROPIC_API_KEY` yet (Ika, 2026-11-18: nothing paid for now). Until the key is set, the Changes tab shows "Suggest changes" greyed out with a not-yet note; adding the key in `.env.local` and Vercel switches it on, nothing else. Step 3 built 2026-11-19 (`20261122000000_google_calendar.sql` run; Google Cloud client "Nia calendar" set up by Ika; Ika booked a real meeting 2026-11-19; live since the Google settings went into Vercel the same day). Grows FB1 (Joshua's meeting companion) in
[FEEDBACK.md](FEEDBACK.md). Before building: Ika agrees this outline and the open questions at
the end, each screen is designed (Claude Design, then Figma), and each part runs as its own step.

Reference Ika shared: a Granola note (title, a row of chips for date, people and folder, then
headings with bullet points). Nia takes the structure, not the look: Geist only (no serif title),
neutral greys, Nia Blue only for the active tab and the one main button.

## What it is

Production meetings (pre-production, recces, client calls, wraps) live inside the project they
belong to. Nia books them in Google Calendar with a Google Meet link. Gemini takes the notes
during the call, and the notes come back to the project by themselves. Notes from any other
notetaker (Otter, Fireflies, Granola, Zoom, Teams, Gemini outside Nia) can be uploaded. Nia then
reads the notes and proposes what to change in the project (action items, dates, cast and crew,
locations, documents). Nothing changes until the producer presses Apply.

## Where it lives

- **Project → Overview → Meetings**, under the Details card (Ika, 2026-11-18; first built under
  Documents), newest first. Each row: title, date and time, attendee avatars, where the notes came from (Gemini,
  Otter, Uploaded…), and a status (`Scheduled`, `Waiting for notes`, `Notes ready`,
  `Changes to review`). The section heading carries one grey button, **Add meeting**, with two
  choices: *Schedule a Google Meet* and *Upload notes*.
- **Opening a meeting** opens the right-hand `SidePanel` (the same panel as the template
  preview: Escape closes it, Expand fills the page, the list stays in reach so the next meeting
  swaps in). Phones get a full-screen page, as the template preview does.
- **Global search** finds meetings by title, the people in them and the notetaker, in the
  Documents group (rule: search keeps up with the data). Words inside the notes: later.

## The meeting panel

Top: the meeting title (editable inline), then a row of chips: the date (tap to change), who
was there (from the transcript's speakers), where the notes came from, and the Meet link while
the meeting is upcoming (step 3). The bin removes the meeting (soft delete). Below, three tabs
(`SectionTabs`):

1. **Summary.** The AI summary (Gemini's, or the uploaded one), always open for typing like a
   document (Ika, 2026-11-19; `meeting-summary.tsx`): section headings, bullets, bold, italic,
   links. Click a point and change it, Enter for the next, Tab to nest; saved a moment after
   typing stops, with the saved tick. "Restore original" brings back what arrived.
   **Action items** (the points under "Action items", "Next steps", "To do"…, with the day each
   mentions, counted from the meeting's day) sit above the notes with **Add to milestones**; a
   flag beside any point sends that one as an action or a milestone, with a date. Nothing is added
   twice, and Overview's Key milestones show them straight away. No AI needed.
2. **Transcript.** Speaker, time and words, with a find box. Read-only (it's the record). Shown
   only when one exists.
3. **Changes.** The proposal: what Nia suggests from these notes, grouped by where it goes (see
   below). Each line has a tick box, the place it will land, and the sentence in the notes it
   came from (so the producer can check it). The panel's one blue button is **Apply**
   (applies the ticked lines). **Dismiss** is grey. Editing a line before applying is Modify.
   Marked "AI draft" until applied.

## What the proposal can fill (on Apply only)

| Where | What Nia proposes | Lands in (today's tables) |
|---|---|---|
| Milestones and actions | Action items with owner and due date; milestones ("Lock the edit by 12 Dec") | `project_milestones` (kind `action` / `milestone`, `due_on`) |
| Dates | Shoot dates, call times, deadlines, next meeting | Milestones with a date until shoot days exist (Milestone 4.3), then the schedule |
| Cast and crew | New people mentioned with a role ("Thabo will DP"), status changes (confirmed, on hold), contact details read out | `people` + `cast_crew` through the quick add, reusing someone with the same email |
| Project details | Production type, genre, logline, client, budget notes | `projects` fields, the same ones Edit Project Details changes |
| Documents | Fields in the project's documents: call sheet times, shot list items, equipment, locations | The document's own fields, through the template engine's field types |
| Locations | Places named for the shoot | Waits for Locations (Milestone 4.2); listed as an action until then |

Anything Nia can't place stays in the summary. Nia never deletes or overwrites anything without
showing the before and after on that line.

## Ways a meeting gets into Nia

**A. Scheduled from Nia (Google).**
1. *Connect Google Calendar* once (Settings → Connections). This is a separate permission from
   signing in with Google.
2. *Schedule a Google Meet* on a project: title, date and time (`DateField`, `TimeField`), people
   (picked from the project's cast and crew, or typed emails). Before booking, Nia checks the
   attendees' free/busy times it can see and warns about clashes (rule: prevent mistakes).
3. Nia creates the Calendar event with a Meet link and the invites, and the meeting appears in
   Meetings and in Home → Upcoming schedule.
4. After the call, Gemini's notes (a Google Doc in the organiser's Drive) and the transcript (if
   transcription was on) arrive on the meeting. Then the proposal is drafted.

**B. Uploaded.** *Upload notes* takes a file or pasted text, plus a title and date (filled in
from the file when it says them). Formats: `.txt`, `.md`, `.docx`, `.pdf` (notes and summaries)
and `.vtt` / `.srt` (transcripts with times). That covers the exports from Otter, Fireflies,
Granola, Zoom, Teams and Gemini. Nia splits what it can into summary and transcript, then
drafts the proposal. Only the words are kept (the file stays on the person's computer; its
name is noted). Headings in the notes become bold lines (the project's text editor has no
headings); the first one is the title.

## What's possible today (checked 2026-11-18)

| Capability | Possible? | Notes |
|---|---|---|
| Create a Calendar event with a Meet link and invites | Yes | Google Calendar API. Works for free Google accounts too |
| Check attendees' free/busy before booking | Partly | Only calendars the organiser can see (their own; colleagues in the same Google Workspace) |
| Turn Gemini notes on automatically for a Nia-made meeting | Unconfirmed | The Meet API has a meeting setting for it (`artifactConfig.smartNotesConfig.autoSmartNotesGeneration`), but whether it works on personal Google AI Pro accounts is untested. Fallback: the organiser clicks "Take notes for me" in Meet |
| Read Gemini's notes after the call | Yes | Meet API `conferenceRecords.smartNotes` points to the Google Doc; Nia reads it with the Docs API. The open-source CRM Twenty does the same |
| Be told when the notes are ready | Yes | Google Workspace Events (`google.workspace.meet.smartNote.v2.fileGenerated`) through Google Cloud Pub/Sub. First version can simply check after the meeting ends |
| Read the transcript | Yes, when it exists | Meet API `transcripts.entries`. Needs transcription turned on (Workspace plans); not confirmed for personal accounts |
| Notes during the meeting (live) | No | Notes arrive minutes after the call ends |
| Gemini notes for free Google accounts | No | Needs Google AI Pro (about $20 a month) or Workspace Business Standard or higher on the organiser's account; the organiser's plan is what counts |
| Upload notes from Otter, Fireflies, Granola, Zoom, Teams | Yes | Any text, Word, PDF or subtitle export |
| Upload an audio or video recording to transcribe | Not in this build | Needs a speech-to-text service; later |
| Zoom or Teams meetings booked from Nia | Not in this build | Upload their notes instead |
| AI proposals from notes | Yes, new to Nia | Claude via the Anthropic API (BUILD_PLAN 5.1's server route and `ANTHROPIC_API_KEY`). Structured output, so every suggestion has a place and a quote. An hour-long meeting costs roughly 10–20 US cents |

## Limitations and risks

- **Plans and places.** Gemini notes need a paid Google plan on the organiser's account, an admin
  switch for Workspace accounts, and are offered in select countries and languages. Check South
  Africa, Nigeria and Kenya before promising it to African creatives. Uploads work for everyone.
- **Google's approval.** Calendar and Meet access are "sensitive" permissions: Google reviews the
  app (a few weeks). Until then up to 100 test users can connect, enough for the beta pilot. Nia
  avoids the "restricted" Drive permissions (they need a paid security audit) by reading the
  notes Doc through the Docs API only.
- **Privacy.** Meeting notes are often personal (money, health, visas). Meetings are visible to
  the people who can edit the project, are not on view-only share links, and soft-delete like
  everything else. Original uploads sit in a private storage bucket.
- **Consent.** Gemini tells everyone in the call that notes are being taken. For uploads, Nia
  asks the uploader to confirm the people in the meeting knew it was recorded (POPIA, GDPR).
- **AI mistakes.** Every suggestion shows the sentence it came from, nothing is applied without
  Apply, and the summary is editable.
- **Matching.** Meetings booked from Nia know their project. Gemini notes from meetings booked
  outside Nia are not pulled in (later: "Import a past meeting" from Calendar).

## Step 2 as built (2026-11-18)

- **When:** a meeting just added opens on Changes and Nia reads it straight away; older meetings
  have a "Suggest changes" button. "Suggest again" reads them afresh.
- **How:** a server action (`src/features/meetings/propose.ts`) reads the meeting, the project's
  details, milestones and cast and crew as the signed-in editor, and asks Claude
  (`claude-opus-5-5`, effort medium) for an answer in a fixed shape (structured output). Every
  suggestion is checked (`proposals.ts`): no title, no name, a date that isn't a day or a detail
  that's already the same are dropped. The notes are treated as material, never as instructions.
- **What it fills today:** actions and milestones (with dates), people for the cast and crew
  (through the quick add, reusing someone already in the workspace), and six project details
  (client, agency, logline, first and last shoot day, due). Documents and locations wait.
- **Where they're kept:** `meetings.proposals` (a list with each suggestion's status), not a
  separate table: they belong to the meeting.
- **Apply** makes the ticked ones (`apply.ts`) and marks them applied; **Dismiss** sets the rest
  aside. Action and milestone words can be changed before applying (Modify).
- **Privacy:** the notes go to Anthropic's API to be read. Anthropic doesn't train on API data.

## Reading uploaded files (2026-11-19)

- **PDFs** are read by where each piece of text sits (`pdf-layout.ts`): wrapped lines join back
  into their paragraph, bigger text becomes a heading, bullets (written or drawn) and indented
  items become list points, page numbers and running headers are left out.
- **Section names** written as plain lines ("Action items", "Suggested next steps:") or whole
  bold lines become headings; to-do boxes ("[ ]", "☐") become points.
- **Starting from Home:** Get started with → Meeting asks which project (recent active ones you
  can edit) and offers **Start a new project** under them, named in place.

## Step 3 as built (2026-11-19)

- **Connect, once:** *Add meeting → Schedule a Google Meet* opens a pop-up. The first time it has
  one button, **Connect Google Calendar**: Nia's own Google connection (`/api/google/connect` and
  `/callback`, `src/lib/google.ts`), separate from signing in with Google. It asks for two
  permissions only: create events on calendars the person owns (`calendar.events.owned`) and see
  when people are busy (`calendar.freebusy`). Google's refresh key is encrypted (AES-256-GCM with
  `GOOGLE_TOKEN_KEY`) before it's stored in `google_connections`, which no browser can read.
  Disconnect (in the pop-up) takes the access back at Google too.
- **Book:** title, date, start, length (15 minutes to 2 hours), guests from the project's whole cast and
  crew (anyone without an email is asked for one, kept on their profile) or typed emails, an optional
  agenda. The title waits empty with "Production meeting" greyed out, the cursor in it. While it's filled in, Nia checks who's
  busy then (organiser and guests whose calendars Google shows) and says so; the button becomes
  "Book anyway". A time that has passed can't be booked.
- **What happens:** the meeting is saved first (the database rules check the person can edit the
  project), then Google creates the Calendar event with a Meet link and emails the invites. If
  Google fails, the half-made meeting is removed. The list shows a video icon and the time; the
  panel shows the date and time and **Join Google Meet**. Moving the meeting is done in Google
  Calendar (Nia doesn't follow changes there yet).
- **Switched off until set:** without `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
  `GOOGLE_TOKEN_KEY` (in `.env.local` and Vercel; the same key in both, changing it disconnects
  everyone), *Schedule a Google Meet* is greyed out with a not-yet note.
- **Google's review:** while the "Nia calendar" app is in Testing, only the test users Ika adds
  (up to 100) can connect, and they see "Google hasn't verified this app". Calendar permissions
  are "sensitive", so Google verifies the app before it's open to everyone.
- **Home's Upcoming schedule** (2026-11-19) lists booked meetings with shoot days, Join on the day.
- **Still to do:** following changes made in
  Google Calendar.

## Data (one migration per part, explained to Ika before she runs it)

- `meetings`: project, workspace, title, starts and ends at, source (`google_meet` or `upload`),
  source app label, Calendar event id, Meet space and link, attendees (name, email, linked
  person), summary (rich text), original summary, transcript (speaker, time, text), notes Doc
  link, original file path, status, created by, timestamps, `deleted_at`. Rules: editors of the
  project only.
- `meetings.proposals` (step 2, instead of a separate table): each suggestion's kind, what it
  changes (before and after for project details), the quote and its status (`proposed`,
  `applied`, `dismissed`); `meetings.proposals_at`.
- `google_connections`: the person, the granted permissions and the encrypted refresh key.
  Server only: no browser can read it.

## Build order (one step at a time, each designed first)

1. **Meetings section and Upload notes.** The section, the panel with Summary and Transcript,
   editing, search. No Google and no AI yet. Useful on day one for anyone with notes from any app.
2. **Proposals.** Claude reads the notes; the Changes tab; Apply into milestones, cast and crew,
   project details. Documents and dates follow as each target is ready.
3. **Connect Google and Schedule a Google Meet.** Calendar event, Meet link, invites, the clash
   warning, Home's Upcoming schedule.
4. **Gemini notes arrive by themselves.** Smart notes and transcript after the call; then the
   proposal is drafted automatically.
5. Later: import past meetings from Calendar, instant arrival through Pub/Sub, audio upload,
   "Ask about this meeting" (Copilot), sharing the notes with guests who aren't on Nia.

## Decided (Ika, 2026-11-18)

1. **Design:** step 1 is built from Nia's existing parts (the documents list, the template
   preview's side panel, the project text editor, tabs), checked on localhost, then reconciled
   into Figma.
2. **Who sees meetings:** editors only (not viewers, not share links).
3. **Plans:** everything free during the beta; Free and Pro are decided before charging.
4. **The "AI draft" marker (step 2):** a Nia Blue tint chip reading "AI draft" (gold is banned).
5. **Order:** step 1 first.
