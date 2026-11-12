// Sentence case for names that are stored in Title Case (Ika, 2026-10-19: sentence case
// everywhere). Project stages, production types, genres and template groups keep their stored
// spelling ("Pre-Production", "Photo Shoot", the database checks them); only what's shown changes:
// "Pre-production", "Photo shoot", "TV series", "UGC & social content".
// Words in capitals (TV, UGC, AV, FAQ, Q&A) stay as they are.
export function sentenceCase(text: string): string {
  let first = true;
  return text.replace(/[A-Za-z][A-Za-z']*/g, (word) => {
    const keep = first || word === word.toUpperCase();
    first = false;
    return keep ? word : word.toLowerCase();
  });
}
