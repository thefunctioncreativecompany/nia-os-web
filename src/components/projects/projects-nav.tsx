import { Suspense } from "react";

import { canUsePortfolios } from "@/features/portfolios/data";
import { ProjectsTabs } from "@/components/projects/projects-tabs";

// The Projects tabs, with Portfolios for the accounts in its beta. The plain tabs show while that's
// checked, so nothing waits on it.
export function ProjectsNav() {
  return (
    <Suspense fallback={<ProjectsTabs />}>
      <WithPortfolios />
    </Suspense>
  );
}

async function WithPortfolios() {
  return <ProjectsTabs portfolios={await canUsePortfolios()} />;
}
