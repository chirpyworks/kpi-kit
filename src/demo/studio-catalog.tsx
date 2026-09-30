import React from 'react';
import type { KitLocale } from '../kit/contracts.js';
import { NavigationStudio } from './NavigationStudio.js';
import { navigationExamples, navigationSnippet } from './navigation-examples.js';
import type { NavigationKind } from './navigation-examples.js';
import { ControlStudio } from './ControlStudio.js';
import { controlExamples, controlSnippet } from './control-examples.js';
import type { ControlKind } from './control-examples.js';
import { StateStudio } from './StateStudio.js';
import { stateExamples, stateSnippet } from './state-examples.js';
import type { StateKind } from './state-examples.js';

export type StudioSection = 'navigation' | 'controls' | 'states' | 'pages';
export interface StudioExample { id: string; label: string; description: string }
export const studioDefaults:Record<StudioSection,string>={navigation:'shell',controls:'form',states:'error',pages:'500'};
export function isStudioSection(section:string):section is StudioSection {
  return ['navigation','controls','states','pages'].includes(section);
}
export function studioExamples(section:StudioSection,locale:KitLocale):StudioExample[] {
  if(section==='navigation')return navigationExamples(locale);
  if(section==='controls')return controlExamples(locale);
  return stateExamples(locale).filter(example=>example.group===(section==='pages'?'page':'data'));
}
export function studioSnippet(section:StudioSection,kind:string,locale:KitLocale):string {
  if(section==='navigation')return navigationSnippet(kind as NavigationKind,locale);
  if(section==='controls')return controlSnippet(kind as ControlKind,locale);
  return stateSnippet(kind as StateKind,locale);
}
export function StudioPreview({section,kind,locale}:{section:StudioSection;kind:string;locale:KitLocale}) {
  if(section==='navigation')return <NavigationStudio key={kind} kind={kind as NavigationKind} locale={locale}/>;
  if(section==='controls')return <ControlStudio key={kind} kind={kind as ControlKind} locale={locale}/>;
  return <StateStudio key={kind} kind={kind as StateKind} locale={locale}/>;
}
