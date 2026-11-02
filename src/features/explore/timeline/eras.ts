// Periods of film history shown behind the Timeline (Ika, 2026-11-02): a tinted band for each,
// named with its years, the one under the playhead highlighted. Commonly used names and dates
// (historians draw the lines a little differently); `to: null` runs to today.

export type Era = { id: string; label: string; from: number; to: number | null; note: string };

export const ERAS: Era[] = [
  { id: "silent", label: "Silent era", from: 1895, to: 1927, note: "From the first public film screenings to The Jazz Singer, the first feature with spoken dialogue." },
  { id: "studio", label: "Studio era", from: 1927, to: 1960, note: "The big studios own the stars, the lots and the cinemas." },
  { id: "new-hollywood", label: "New Hollywood", from: 1967, to: 1980, note: "From Bonnie and Clyde to Heaven's Gate: directors take the lead." },
  { id: "blockbuster", label: "Blockbuster era", from: 1980, to: 2000, note: "After Jaws and Star Wars: event films, sequels and the multiplex." },
  { id: "digital", label: "Digital era", from: 2000, to: 2013, note: "Digital cameras, editing and DVD change how films are made and seen." },
  { id: "streaming", label: "Streaming era", from: 2013, to: null, note: "From Netflix's first original series, House of Cards: films and series made for streaming." },
];

export const eraStart = (e: Era) => Date.UTC(e.from, 0, 1);
export const eraEnd = (e: Era, now: number) => (e.to === null ? now : Date.UTC(e.to, 0, 1));
export const eraYears = (e: Era) => `${e.from}–${e.to ?? "today"}`;
export const eraAt = (t: number, now: number) => ERAS.find((e) => t >= eraStart(e) && t < eraEnd(e, now)) ?? null;
