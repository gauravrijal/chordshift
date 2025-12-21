
export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function getNoteIndex(note: string): number {
  const n = note.toUpperCase();
  const sharpIndex = NOTES_SHARP.indexOf(n);
  if (sharpIndex !== -1) return sharpIndex;
  return NOTES_FLAT.indexOf(n);
}

export function transposeNote(note: string, semitones: number, preferSharps: boolean | 'auto', keyContext: 'sharp' | 'flat' = 'sharp'): string {
  if (note === 'N.C.') return note;
  
  const idx = getNoteIndex(note);
  if (idx === -1) return note; // fallback

  let newIndex = (idx + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Enharmonic logic
  let useSharps = true;
  if (preferSharps === 'auto') {
    useSharps = keyContext === 'sharp';
  } else {
    useSharps = Boolean(preferSharps);
  }

  return useSharps ? NOTES_SHARP[newIndex] : NOTES_FLAT[newIndex];
}

// Helper to determine if a key (implied by the chords) is likely sharp or flat
// This is a simple heuristic: if the chord list has more flats, use flats.
export function determineKeyPreference(chords: string[]): 'sharp' | 'flat' {
  let sharpCount = 0;
  let flatCount = 0;
  for (const c of chords) {
    if (c.includes('#')) sharpCount++;
    if (c.includes('b')) flatCount++;
  }
  return flatCount > sharpCount ? 'flat' : 'sharp';
}

/**
 * Transposes a full chord string (e.g. "Am7/G")
 */
export function transposeChord(chordToken: string, semitones: number, preferSharps: boolean | 'auto' = 'auto', forcedKeyContext?: 'sharp' | 'flat'): string {
  // Regex to split Root + Remainder + SlashRoot
  // Matches: Note (A-G + acc) + quality/extensions + optional slash + Note
  
  // A simple parsing strategy:
  // 1. Identify Root 
  // 2. Identify rest
  // 3. Check for Slash
  
  const rootRegex = /^([A-G][#b]?)(.*)$/;
  const match = chordToken.match(rootRegex);
  
  if (!match) return chordToken;
  
  const root = match[1];
  const rest = match[2];
  
  // Logic for Auto Key Context if not provided
  // For a single chord, we default to sharp unless it's already flat? 
  // Actually, standard is to use the requested preference.
  
  const ctx = forcedKeyContext || (root.includes('b') ? 'flat' : 'sharp'); 
  
  const newRoot = transposeNote(root, semitones, preferSharps, ctx);
  
  // Check slash
  if (rest.includes('/')) {
      const parts = rest.split('/');
      const quality = parts[0];
      const bass = parts[1];
      
      // Attempt to transpose bass if it is a note
      const bassIdx = getNoteIndex(bass);
      if (bassIdx !== -1) {
          const newBass = transposeNote(bass, semitones, preferSharps, ctx);
          return `${newRoot}${quality}/${newBass}`;
      }
      return `${newRoot}${rest}`;
  }
  
  return `${newRoot}${rest}`;
}
