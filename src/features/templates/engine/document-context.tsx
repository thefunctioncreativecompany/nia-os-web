'use client';

import { createContext, useContext } from 'react';

import type { TemplateSchema } from '../types';
import type { SectionValue } from './sections';

// The whole document, for controls that read another section: a Cast column ticks rows of the
// Cast & Talent Calls table, a Location column offers the Locations answers.
export const DocumentContext = createContext<{ schema: TemplateSchema; data: SectionValue[] } | null>(null);

export const useDocumentContext = () => useContext(DocumentContext);
