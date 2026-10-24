-- More production types on projects (Ika, 2026-10-23), for creators and brand work as well as
-- film and TV. Matches PRODUCTION_TYPES in src/lib/projects.ts. Safe to run twice.

alter table public.projects drop constraint if exists projects_production_type_check;
alter table public.projects add constraint projects_production_type_check check (production_type in (
  'Film', 'TV Series', 'Short Film', 'Documentary', 'Music Video', 'Commercial',
  'Interview', 'Behind the Scenes', 'Photo Shoot', 'Live Event',
  'Feature Film', 'Web Series', 'Fashion Film', 'Editorial', 'Lookbook', 'Campaign',
  'Branded Content', 'Social Content', 'Podcast', 'Corporate Video', 'Trailer', 'Stage Production'));
