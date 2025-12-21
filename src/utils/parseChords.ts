import { transposeChord, determineKeyPreference } from './transpose';

// Valid Chord Logic
// Refined regex from specs
export const CHORD_REGEX = /^(?:N\.?C\.?|[A-G][#b]{0,2}(?:(?:maj|min|m|dim|aug|sus|add)\d*)?(?:[m0-9\(\)#b\-]*)(?:\/[A-G][#b]{0,2})?)$/;

// Strict regex for finding valid chords to count density
const STRICT_CHORD_REGEX = /^(?:[A-G][#b]?(?:m|maj|dim|aug|sus|add|7|9|11|13|5)*[0-9]*(?:\/[A-G][#b]?)?)$/;


export type LineType = 'lyric' | 'chord';

interface Token {
    text: string;
    isChord: boolean;
    isSeparator: boolean;
}

export function isChord(token: string): boolean {
    // 1. Cleanup
    const clean = token.replace(/^\[|\]|\(|\)$/g, ''); // formatting chars
    if (!clean) return false;

    // 2. Basic Regex Match
    if (!STRICT_CHORD_REGEX.test(clean)) {
        // Allow N.C.
        if (clean === 'N.C.' || clean === 'NC') return true;
        return false;
    }

    // 3. Anti-Am/A Word trap
    // If it is a simple word like "A", "I", "Am", "To" (not to, but maybe B?), "At" (A#?) -> unlikely unless specified
    // But STRICT regex only matches A-G. "At" is not a note. "Am" is A minor.
    // "A" is a word.

    if (clean === 'A' || clean === 'a') return true; // ambiguous
    if (clean === 'I') return false; // I is not a note
    if (clean === 'Am' || clean === 'am') return true; // ambiguous

    return true;
}

export function parseLine(line: string): { type: LineType; tokens: Token[] } {
    // Split preserving whitespace
    // We want to keep spaces to preserve layout
    const parts = line.split(/(\s+|\[.*?\]|\(.*?\)|\/)/g).filter(x => x);

    let chordCount = 0;
    let wordCount = 0;

    // Heuristic scan
    const tempTokens = parts.map(part => {
        const trimmed = part.trim();
        if (!trimmed) return { text: part, isProp: false };

        // Check if it's strictly a chord-like shape
        // We look for explicitly bracketed stuff [G] -> definitely chord
        if (/^\[.+\]$/.test(trimmed)) return { text: part, isProp: true, sure: true };

        if (isChord(trimmed)) return { text: part, isProp: true, sure: false };
        return { text: part, isProp: false };
    });

    const sureChords = tempTokens.filter(t => t.sure).length;
    const potentialChords = tempTokens.filter(t => t.isProp).length;
    const totalGraphicTokens = tempTokens.filter(t => t.text.trim().length > 0).length;

    if (totalGraphicTokens === 0) return { type: 'lyric', tokens: [] }; // empty line

    // Decision: Is this a chord line?
    // If > 50% of tokens are potential chords, OR we have bracketed chords
    let isChordLine = false;

    if (sureChords > 0) {
        // If we have explicit brackets, we treat those as chords, but tone mapping might be mixed.
        // Actually, if brackets exist, we usually only transpose the brackets.
        // But standard "Chord sheet" lines might not have brackets.
        isChordLine = (potentialChords / totalGraphicTokens) > 0.4; // lowered threshold
    } else {
        isChordLine = (potentialChords / totalGraphicTokens) > 0.5;
    }

    // Re-process tokens based on line decision
    const finalTokens = parts.map(part => {
        const trimmed = part.trim();
        const isSpace = !trimmed;

        if (isSpace) return { text: part, isChord: false, isSeparator: true };

        // If bracketed, it IS a chord
        if (/^\[.+\]$/.test(trimmed) || /^\(.+\)$/.test(trimmed)) {
            // Strip brackets to check validity? 
            // For now, assume user bracketed intention
            return { text: part, isChord: true, isSeparator: false };
        }

        if (isChordLine) {
            // If it looks like a chord, it is one.
            if (isChord(trimmed)) return { text: part, isChord: true, isSeparator: false };
            // "Am" on a chord line is Am.
        } else {
            // Lyric line. only transpose if VERY sure (e.g. bracketed, which we handled)
            // "Am" on a lyric line is "I Am".
        }

        return { text: part, isChord: false, isSeparator: false };
    });

    return { type: isChordLine ? 'chord' : 'lyric', tokens: finalTokens };
}

export function transposeDetails(text: string, semitones: number, preferSharps: boolean | 'auto'): string {
    const lines = text.split('\n');

    // First pass: determine key context if auto
    let allChords: string[] = [];
    // We could do a pre-pass to gather all chords to decide safe Auto.
    // For now, efficient line-by-line is okay, but "Auto" needs global context? 
    // Let's do a quick scan if 'auto'

    let forcedContext: 'sharp' | 'flat' = 'sharp';
    if (preferSharps === 'auto') {
        const fullTextChords = text.match(/[A-G][#b]?/g) || [];
        forcedContext = determineKeyPreference(fullTextChords);
    }

    return lines.map(line => {
        const { tokens } = parseLine(line);
        return tokens.map(token => {
            if (token.isChord) {
                // handle formatting
                let content = token.text;
                let prefix = '';
                let suffix = '';

                if (content.startsWith('[')) { prefix = '['; content = content.slice(1); }
                else if (content.startsWith('(')) { prefix = '('; content = content.slice(1); }

                if (content.endsWith(']')) { suffix = ']'; content = content.slice(0, -1); }
                else if (content.endsWith(')')) { suffix = ')'; content = content.slice(0, -1); }

                return prefix + transposeChord(content, semitones, preferSharps, forcedContext) + suffix;
            }
            return token.text;
        }).join('');
    }).join('\n');
}
