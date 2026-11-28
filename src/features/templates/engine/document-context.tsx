'use client';

import { createContext, useContext } from 'react';

import type { TemplateSchema } from '../types';
import type { SectionValue } from './sections';

// The whole document, for controls that read another section: a Cast column ticks rows of the
// Cast & Talent Calls table, a Location column offers the Locations answers. `projectId` when the
// document is in a project: its text boxes can then @mention the people on it.
export const DocumentContext = createContext<{ schema: TemplateSchema; data: SectionValue[]; projectId?: string | null } | null>(null);

export const useDocumentContext = () => useContext(DocumentContext);
