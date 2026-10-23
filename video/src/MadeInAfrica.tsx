import { loadFont } from "@remotion/fonts";
import { ArrowLeftRight, Award, Bookmark, Plus } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { collections, countFor, cover, covers, metaLine, stats, title } from "./data";
import { theme } from "./theme";

loadFont({ family: "Geist", url: staticFile("fonts/Geist-Regular.ttf"), weight: "400" });
loadFont({ family: "Geist", url: staticFile("fonts/Geist-Bold.ttf"), weight: "700" });

// The study pairings the card shows in turn, and the frame each one starts on.
const PAIRINGS = [
  { slug: "atlantics", from: 110 },
  { slug: "rafiki", from: 230 },
  { slug: "shaka-ilembe", from: 340 },
];
export const DURATION = 450;
// The still shows every part settled, with Atlantics in the card.
export const STILL_FRAME = 200;

const PAD = 96;
const POSTER = { w: 220, h: 330, gap: 24 };

/** 0 → 1 as an element settles in, starting at `delay`. */
function useEnter(frame: number, delay: number) {
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 24 });
}

const rise = (p: number, distance = 32): CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * distance}px)`,
});

export function MadeInAfrica({ frame: fixed }: { frame?: number }) {
  const current = useCurrentFrame();
  const frame = fixed ?? current;

  const active = PAIRINGS.findLastIndex((p) => frame >= p.from);
  const activeCollection = active >= 0 ? title(PAIRINGS[active].slug).collection : null;

  return (
    <AbsoluteFill style={{ background: theme.obsidian, color: theme.white, fontFamily: theme.font }}>
      <PosterWall frame={frame} />
      <Header frame={frame} />
      <Intro frame={frame} activeCollection={activeCollection} />
      <PairingCard frame={frame} />
      <Credit frame={frame} />
    </AbsoluteFill>
  );
}

function Header({ frame }: { frame: number }) {
  const p = useEnter(frame, 4);
  return (
    <div style={{ position: "absolute", top: 64, left: PAD, right: PAD, display: "flex", alignItems: "center", gap: 28, opacity: p }}>
      <Img src={staticFile("brand/nia-wordmark-white.svg")} style={{ height: 34 }} />
      <div style={{ width: 1, height: 28, background: theme.line }} />
      <div style={{ fontSize: 22, color: theme.muted }}>
        Explore <span style={{ margin: "0 10px" }}>›</span>
        <span style={{ color: theme.white }}>Made in Africa</span>
      </div>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 44,
          padding: "0 20px",
          borderRadius: 999,
          border: `1px solid ${theme.line}`,
          background: "rgba(10, 9, 8, 0.6)",
          fontSize: 18,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: theme.gold }} />
        Early access
      </div>
    </div>
  );
}

function Intro({ frame, activeCollection }: { frame: number; activeCollection: string | null }) {
  const line1 = useEnter(frame, 12);
  const line2 = useEnter(frame, 20);
  const sub = useEnter(frame, 32);
  const chipsLabel = useEnter(frame, 70);

  const statItems = [
    { value: stats.titles, label: "films and series" },
    { value: stats.collections, label: "collections" },
    { value: stats.countries, label: "African countries" },
    { value: stats.to - stats.from, label: `years, ${stats.from} to ${stats.to}` },
  ];

  return (
    <div style={{ position: "absolute", top: 236, left: PAD, width: 860 }}>
      <h1 style={{ margin: 0, fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
        <div style={rise(line1, 40)}>African cinema,</div>
        <div style={rise(line2, 40)}>curated for the craft.</div>
      </h1>
      <p style={{ margin: "30px 0 0", maxWidth: 700, fontSize: 27, lineHeight: 1.42, color: theme.muted, ...rise(sub) }}>
        {stats.titles} films and series chosen for their cinematography and writing, each paired with a global film that shares
        its craft.
      </p>

      <div style={{ display: "flex", gap: 48, marginTop: 52 }}>
        {statItems.map((s, i) => (
          <Stat key={s.label} frame={frame} delay={44 + i * 6} {...s} />
        ))}
      </div>

      <div style={{ marginTop: 52, fontSize: 18, color: theme.muted, ...rise(chipsLabel, 16) }}>Seven collections</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
        {collections.map((c, i) => (
          <Chip key={c.slug} frame={frame} delay={74 + i * 4} name={c.name} count={countFor(c.slug)} on={c.slug === activeCollection} />
        ))}
      </div>
    </div>
  );
}

function Stat({ frame, delay, value, label }: { frame: number; delay: number; value: number; label: string }) {
  const p = useEnter(frame, delay);
  const shown = Math.round(
    interpolate(frame, [delay, delay + 36], [0, value], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
  );
  return (
    <div style={rise(p, 20)}>
      <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{shown}</div>
      <div style={{ marginTop: 10, fontSize: 18, color: theme.muted }}>{label}</div>
    </div>
  );
}

// Explore's filter chip: 40px pill; on = gold border and a light gold tint.
function Chip({ frame, delay, name, count, on }: { frame: number; delay: number; name: string; count: number; on: boolean }) {
  const p = useEnter(frame, delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 44,
        padding: "0 18px",
        borderRadius: 999,
        border: `1px solid ${on ? theme.gold : theme.line}`,
        background: on ? "rgba(138, 122, 82, 0.22)" : "rgba(255, 255, 255, 0.04)",
        fontSize: 18,
        transition: "none",
        ...rise(p, 12),
      }}
    >
      {name}
      <span style={{ color: theme.muted }}>{count}</span>
    </div>
  );
}

// Every cover, in four columns drifting in turn up and down (Explore's motion exception).
function PosterWall({ frame }: { frame: number }) {
  const columns = [0, 1, 2, 3].map((c) => covers.filter((_, i) => i % 4 === c));
  const fade = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {columns.map((list, c) => {
        const cycle = list.length * (POSTER.h + POSTER.gap);
        const speed = c % 2 === 0 ? -0.7 : 0.7;
        const offset = ((((c * 173 + frame * speed) % cycle) + cycle) % cycle) - cycle;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: 980 + c * (POSTER.w + POSTER.gap),
              top: offset,
              display: "flex",
              flexDirection: "column",
              gap: POSTER.gap,
            }}
          >
            {[...list, ...list, ...list].map((src, i) => (
              <Img
                key={i}
                src={staticFile(src)}
                style={{ width: POSTER.w, height: POSTER.h, objectFit: "cover", borderRadius: theme.radius.lg, display: "block" }}
              />
            ))}
          </div>
        );
      })}
      {/* Blend the wall into the page on the left, top and bottom, and dim it behind the card. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, ${theme.obsidian} 0%, ${theme.obsidian} 48%, rgba(10, 9, 8, 0.35) 64%, rgba(10, 9, 8, 0.2) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.obsidian} 0%, rgba(10, 9, 8, 0) 18%, rgba(10, 9, 8, 0) 46%, rgba(10, 9, 8, 0.82) 82%, ${theme.obsidian} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}

function PairingCard({ frame }: { frame: number }) {
  const p = useEnter(frame, PAIRINGS[0].from);
  return (
    <div
      style={{
        position: "absolute",
        right: PAD,
        bottom: PAD,
        width: 820,
        height: 360,
        borderRadius: theme.radius["2xl"],
        border: `1px solid ${theme.line}`,
        background: theme.panel,
        backdropFilter: "blur(24px)",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
        ...rise(p, 60),
      }}
    >
      {PAIRINGS.map((pairing, i) => {
        // The last pairing holds to the end (fading out after DURATION, which never comes).
        const end = PAIRINGS[i + 1]?.from ?? DURATION + 12;
        const opacity =
          interpolate(frame, [pairing.from, pairing.from + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
          interpolate(frame, [end - 12, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return opacity > 0 ? <Pairing key={pairing.slug} slug={pairing.slug} opacity={i === 0 ? Math.max(opacity, p) : opacity} /> : null;
      })}
    </div>
  );
}

function Pairing({ slug, opacity }: { slug: string; opacity: number }) {
  const t = title(slug);
  const src = cover(slug);
  const collection = collections.find((c) => c.slug === t.collection)!;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", gap: 32, padding: 30, opacity }}>
      {src && (
        <Img
          src={staticFile(src)}
          style={{ width: 200, height: 300, flex: "none", objectFit: "cover", borderRadius: theme.radius.lg }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 16, color: theme.muted }}>Study pairing · {collection.name}</div>
        <div style={{ marginTop: 8, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{t.title}</div>
        <div style={{ marginTop: 6, fontSize: 18, color: theme.muted }}>{metaLine(t)}</div>
        {t.recognition && (
          <Row icon={<Award size={20} color={theme.muted} />} style={{ marginTop: 14 }}>
            {t.recognition}
          </Row>
        )}
        <Row icon={<ArrowLeftRight size={20} color={theme.gold} />} style={{ marginTop: 10 }}>
          <span style={{ color: theme.muted }}>Pair with</span>&nbsp;{t.pair_with}
        </Row>
        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            lineHeight: 1.4,
            color: theme.muted,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {t.study_note}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
          <Pill icon={<Bookmark size={18} />} outline>
            Save
          </Pill>
          <Pill icon={<Plus size={18} />}>Add to project</Pill>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children, style }: { icon: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, whiteSpace: "nowrap", overflow: "hidden", ...style }}>
      <span style={{ display: "flex", flex: "none" }}>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    </div>
  );
}

// The app's pill button: 44px, rounded, bold.
function Pill({ icon, children, outline }: { icon: ReactNode; children: ReactNode; outline?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 44,
        padding: "0 22px",
        borderRadius: 999,
        fontSize: 17,
        fontWeight: 700,
        border: `1px solid ${outline ? theme.line : theme.white}`,
        background: outline ? "transparent" : theme.white,
        color: outline ? theme.white : theme.obsidian,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

function Credit({ frame }: { frame: number }) {
  const p = useEnter(frame, 90);
  return (
    <div style={{ position: "absolute", left: PAD, bottom: 44, width: 760, fontSize: 13, lineHeight: 1.5, color: theme.muted, opacity: p * 0.8 }}>
      Posters from TMDB (themoviedb.org), shown for educational purposes while Nia is in beta. Nia isn&rsquo;t endorsed or certified by
      TMDB and earns no revenue from them.
    </div>
  );
}
