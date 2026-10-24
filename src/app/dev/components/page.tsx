import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionProvider } from "@/components/nia/motion-provider";

import {
  ButtonsSection,
  PageControlsSection,
  SlidersSection,
  TogglesSection,
} from "./_sections/controls";
import { MenusSection, ModalsSection, SheetsSection } from "./_sections/overlays";
import { AlertsSection, FormsSection, NotificationsSection, PickersSection } from "./_sections/feedback";
import { DialogsSection, ListsSection, ProgressSection, SearchSection } from "./_sections/lists";
import { AdvancedPickersSection, InboxSection, MediaSection, TablesSection } from "./_sections/media";
import {
  AdvancedTabsSection,
  ChartsSection,
  ExportSection,
  MapSection,
  PanelsSection,
  PreviewSection,
} from "./_sections/data";
import {
  CardsSection,
  CastCrewSection,
  NavigationSection,
  ProjectModalsSection,
  TemplatesSection,
} from "./_sections/patterns";
import { TemplateViewsSection } from "./_sections/templates-views";

export const metadata: Metadata = {
  title: "Component library · Nia OS",
  robots: { index: false, follow: false },
};

// Section menu, in design-system order.
const SECTIONS = [
  { id: "buttons", label: "1. Buttons" },
  { id: "toggles", label: "2. Toggles" },
  { id: "sliders", label: "3. Sliders & Steppers" },
  { id: "page-controls", label: "4. Page Controls" },
  { id: "menus", label: "5. Menus & Dropdowns" },
  { id: "modals", label: "6. Modals & Dialogs" },
  { id: "sheets", label: "7. Bottom Sheets" },
  { id: "notifications", label: "8. Notifications & Toasts" },
  { id: "alerts", label: "9. Alerts" },
  { id: "pickers", label: "10. Date & Time Pickers" },
  { id: "forms", label: "11. Form Fields" },
  { id: "dialogs", label: "12. Dialogs" },
  { id: "lists", label: "13. Lists" },
  { id: "progress", label: "14. Loading & Progress" },
  { id: "search", label: "15. Search Bars" },
  { id: "advanced-pickers", label: "16. Pickers: Advanced" },
  { id: "media", label: "17. Gallery / Media" },
  { id: "tables", label: "18. Tables" },
  { id: "inbox", label: "19. Inbox & Notifications" },
  { id: "charts", label: "20. Charts & Data" },
  { id: "map", label: "21. Map View" },
  { id: "advanced-tabs", label: "22. Tabs: Advanced" },
  { id: "panels", label: "23. Sheets & Panels" },
  { id: "export", label: "24. Export Document" },
  { id: "preview", label: "25. Preview Panel" },
  { id: "navigation", label: "26. Navigation & Account" },
  { id: "cast-crew", label: "27. Cast & Crew" },
  { id: "cards", label: "28. Cards & Forms" },
  { id: "templates", label: "29. Templates & Explore" },
  { id: "project-modals", label: "30. Project Modals" },
  { id: "template-views", label: "31. Templates: retired views" },
];

// Every component and variant, side by side for comparing with the nOS Design System
// in Figma (BUILD_PLAN 0.5). Hidden on the production site.
export default function Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <MotionProvider>
      <TooltipProvider>
        <div className="min-h-svh bg-background">
          <header className="border-b border-border px-4 py-6 md:px-10">
            <p className="font-wordmark text-wordmark font-bold text-foreground">NIA</p>
            <h1 className="mt-2 text-h1 font-bold text-foreground">Component library</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              The nOS Design System built on shadcn/ui and the Nia theme. Use these components (src/components/ui and
              src/components/nia) when building screens.
            </p>
          </header>
          <div className="flex flex-wrap">
            <nav
              aria-label="Sections"
              className="flex-[1_1_220px] border-border px-4 py-6 md:sticky md:top-0 md:max-h-svh md:max-w-[260px] md:overflow-y-auto md:border-r md:px-6"
            >
              <ul className="flex flex-wrap gap-x-4 gap-y-1 md:flex-col">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="block rounded-md py-1 text-small text-muted-foreground hover:text-foreground">
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-16 px-4 py-8 md:px-10">
              <ButtonsSection />
              <TogglesSection />
              <SlidersSection />
              <PageControlsSection />
              <MenusSection />
              <ModalsSection />
              <SheetsSection />
              <NotificationsSection />
              <AlertsSection />
              <PickersSection />
              <FormsSection />
              <DialogsSection />
              <ListsSection />
              <ProgressSection />
              <SearchSection />
              <AdvancedPickersSection />
              <MediaSection />
              <TablesSection />
              <InboxSection />
              <ChartsSection />
              <MapSection />
              <AdvancedTabsSection />
              <PanelsSection />
              <ExportSection />
              <PreviewSection />
              <NavigationSection />
              <CastCrewSection />
              <CardsSection />
              <TemplatesSection />
              <ProjectModalsSection />
              <TemplateViewsSection />
            </main>
          </div>
        </div>
      </TooltipProvider>
    </MotionProvider>
  );
}
