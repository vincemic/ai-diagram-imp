import { z } from 'zod';

const PreferencesSchema = z.object({
  theme: z.enum(['dark']).default('dark'),
  lastOpenedTitle: z.string().optional()
});

export type Preferences = z.infer<typeof PreferencesSchema>;

const STORAGE_KEY = 'ai-diagram-imp:preferences:v1';

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PreferencesSchema.parse({});
    const parsed = JSON.parse(raw);
    return PreferencesSchema.parse(parsed);
  } catch {
    return PreferencesSchema.parse({});
  }
}

export function savePreferences(prefs: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function updatePreferences(mutator: (p: Preferences) => Preferences) {
  const next = mutator(loadPreferences());
  savePreferences(next);
  return next;
}
