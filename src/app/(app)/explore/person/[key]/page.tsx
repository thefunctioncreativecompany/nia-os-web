import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CastCrewRow, PersonPicture } from "@/components/nia/cast-crew-row";
import { ScrollRow } from "@/components/nia/scroll-row";
import { ExploreCard, cardSpan } from "@/components/explore/title-card";
import { exploreHome } from "@/features/explore/made-in-africa";
import { profileUrl } from "@/features/explore/creators";
import { exploreItem } from "@/features/explore/items";
import { creatorPeopleKeys, findPerson, workedWith } from "@/features/explore/people-index";

// Creator films' people are drawn once at build; the two thousand or so film people on their
// first visit.
export function generateStaticParams() {
  return creatorPeopleKeys().map((key) => ({ key }));
}

export async function generateMetadata({ params }: PageProps<"/explore/person/[key]">): Promise<Metadata> {
  const { key } = await params;
  const person = findPerson(decodeURIComponent(key));
  return { title: person ? `${person.name} · Explore · Nia OS` : "Explore · Nia OS" };
}

// A person on Explore (Ika, 2026-11-01, after Apple TV's person page): their picture (a credited
// Commons photo for film people, else initials until they choose one), name and roles, where to
// find them, then the films they're credited on and the people they made them with. Nothing about
// them is written that the credits don't say.
export default function Page({ params }: PageProps<"/explore/person/[key]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-10 h-96 rounded-2xl md:mx-15" />}>
      <PersonPage params={params} />
    </Suspense>
  );
}

async function PersonPage({ params }: Pick<PageProps<"/explore/person/[key]">, "params">) {
  const { key } = await params;
  const person = findPerson(decodeURIComponent(key));
  if (!person) notFound();
  const films = person.films.flatMap((f) => {
    const item = exploreItem(f.slug);
    return item ? [{ item, role: f.role }] : [];
  });
  const shown = person.roles.slice(0, 3).join(" · ");

  return (
    <div className="flex flex-1 flex-col gap-12 px-4 pt-10 pb-15 md:px-15">
      <Link href={exploreHome()} className="w-fit rounded-sm text-sm leading-[1.4] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        ← Back to Explore
      </Link>

      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-10 sm:text-left">
        <div className="flex flex-col items-center gap-2">
          <PersonPicture name={person.name} photo={person.photo?.src} large className="size-40 md:size-56" />
          {person.photo && (
            <a href={person.photo.page} target="_blank" rel="noopener noreferrer" className="max-w-56 text-center text-meta text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Photo: {person.photo.author}, {person.photo.licence}, Wikimedia Commons
            </a>
          )}
        </div>
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-h2 font-bold text-foreground md:text-h1">{person.name}</h1>
          <p className="text-lead text-muted-foreground">
            {shown}
            {shown && " · "}
            Credited on {films.length} {films.length === 1 ? "film" : "films"} on Explore
          </p>
          {person.handle && (
            <Button asChild variant="outline" className="w-fit max-sm:self-center">
              <a href={profileUrl(person.handle)} target="_blank" rel="noopener noreferrer">
                @{person.handle} on Instagram <ArrowUpRight aria-hidden data-icon="inline-end" />
              </a>
            </Button>
          )}
          <p className="text-caption text-muted-foreground">
            {person.source === "wikidata" ? "Credits from Wikidata." : "From the credits in each film\u2019s caption. Is this you? Claiming your credit opens soon."}
          </p>
        </div>
      </header>

      <section aria-labelledby="films" className="flex flex-col gap-4">
        <h2 id="films" className="text-xl leading-[1.4] font-bold text-foreground">
          Films <span className="text-micro font-normal text-muted-foreground">{films.length}</span>
        </h2>
        <ScrollRow label="Films">
          {films.map(({ item, role }) => (
            <li key={item.slug} className="w-[calc(44%*var(--span,1))] flex-none snap-start sm:w-[calc(30%*var(--span,1))] md:w-[calc(22%*var(--span,1))] lg:w-[calc(16%*var(--span,1))]" style={cardSpan(item)}>
              <ExploreCard item={item} href={item.href()} sizes="(min-width: 64rem) 16vw, (min-width: 40rem) 30vw, 44vw" note={role} />
            </li>
          ))}
        </ScrollRow>
      </section>

      <CastCrewRow label="Worked with" people={workedWith(person)} />
    </div>
  );
}
