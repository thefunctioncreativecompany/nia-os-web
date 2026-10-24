"use client";

import dynamic from "next/dynamic";

// References and Inspiration sit low on the project page and carry Explore's catalogue, so they
// come in their own download: the rest of the page responds without waiting for them.
export const ProjectInspiration = dynamic(() => import("./project-inspiration").then((m) => m.ProjectInspiration));
