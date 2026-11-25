"use client";

import dynamic from "next/dynamic";

// References and Inspiration sit low on the project page and carry Explore's catalogue, so they
// come in their own download: the rest of the page responds without waiting for them.
export const ProjectInspiration = dynamic(() => import("./project-inspiration").then((m) => m.ProjectInspiration));

// The References section (folders and the gallery) also carries Explore's catalogue, so it loads
// the same way.
export const ProjectReferences = dynamic(() => import("./project-references").then((m) => m.ProjectReferences));
