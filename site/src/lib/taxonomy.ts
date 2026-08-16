export interface Category {
  id: string;
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'everyday', label: 'Everyday life', description: 'Lost items, housework, errands, daily needs' },
  { id: 'illness', label: 'Illness & healing', description: 'Diseases, mental health, specific conditions' },
  { id: 'jobs', label: 'Jobs & professions', description: 'Vocations, trades, occupations' },
  { id: 'travel', label: 'Travel & transport', description: 'Travelers, drivers, sailors, aviators' },
  { id: 'persecution', label: 'Persecution & prisoners', description: 'Martyrs, oppressed, prisoners, refugees' },
  { id: 'spiritual', label: 'Spiritual life', description: 'Doubt, conversion, prayer, temptations' },
  { id: 'military', label: 'Military & first responders', description: 'Soldiers, police, firefighters, EMS' },
  { id: 'family', label: 'Children & family', description: 'Children, mothers, fathers, fertility, marriage' },
  { id: 'nature', label: 'Animals & nature', description: 'Pets, ecology, environment, weather' },
  { id: 'special', label: 'Special intentions', description: 'Impossible causes, the dying, the poor' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const NEED_SYNONYMS: Record<string, string[]> = {
  'lost items': ['lost keys', 'missing things', 'misplaced objects'],
  'anxiety': ['worry', 'stress', 'nervousness'],
  'travelers': ['travel', 'journeys', 'trips'],
  'soldiers': ['military', 'armed forces'],
  'expectant mothers': ['pregnancy', 'childbirth', 'expecting'],
  'impossible causes': ['hopeless causes', 'desperate situations'],
  'students': ['studies', 'exams', 'learning'],
  'sick children': ['sick kids', 'ill children'],
  'mental illness': ['depression', 'mental health'],
  'cancer': ['tumors', 'oncology'],
};

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
