import { InfoNote } from "@/components/nia/info-note";

// Credit for the data Explore takes from TMDB (Ika, 2026-10-21: say so plainly while Nia is in
// beta). Shown wherever Made in Africa covers or genres appear, behind a small (i) button (Ika,
// 2026-10-22) rather than as a paragraph under every row.
export function TmdbCredit({ className }: { className?: string }) {
  return (
    <InfoNote label="Where these posters come from" className={className}>
      <p>
        Posters and genres come from TMDB (
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          themoviedb.org
        </a>
        ). Nia isn&rsquo;t endorsed or certified by TMDB. They&rsquo;re shown for educational purposes while Nia is in beta testing, and Nia earns no
        revenue from them. Trailers play from their owners&rsquo; official channels.
      </p>
    </InfoNote>
  );
}
