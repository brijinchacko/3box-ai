import { COMMON_WORDS } from './commonWords';

export interface GibberishCheckResult {
  isGibberish: boolean;
  reason: string;
}

export function detectGibberish(text: string): GibberishCheckResult {
  const flags: string[] = [];

  // 1. Word count check
  const rawWords = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (rawWords.length < 5) {
    return {
      isGibberish: true,
      reason: 'Too short to be a valid job description.',
    };
  }

  // Clean words: remove punctuation, lowercase
  const cleanedWords = rawWords
    .map((w) => w.replace(/[^a-zA-Z0-9'-]/g, '').toLowerCase())
    .filter((w) => w.length > 0);

  // 2. Dictionary word ratio check
  if (cleanedWords.length > 0) {
    const recognizedCount = cleanedWords.filter((w) =>
      COMMON_WORDS.has(w)
    ).length;
    const ratio = recognizedCount / cleanedWords.length;
    if (ratio < 0.25) {
      flags.push("The text doesn't appear to contain recognizable words.");
    }
  }

  // 3. Consecutive consonant clusters check
  const consonants = new Set('bcdfghjklmnpqrstvwxyz'.split(''));
  if (cleanedWords.length > 0) {
    let clusterWordCount = 0;
    for (const word of cleanedWords) {
      let consecutiveConsonants = 0;
      let hasLongCluster = false;
      for (const char of word) {
        if (consonants.has(char)) {
          consecutiveConsonants++;
          if (consecutiveConsonants >= 5) {
            hasLongCluster = true;
            break;
          }
        } else {
          consecutiveConsonants = 0;
        }
      }
      if (hasLongCluster) {
        clusterWordCount++;
      }
    }
    const clusterRatio = clusterWordCount / cleanedWords.length;
    if (clusterRatio > 0.4) {
      flags.push(
        'The text contains too many unrecognizable character sequences.'
      );
    }
  }

  // 4. Average word length check
  if (cleanedWords.length > 0) {
    const totalLength = cleanedWords.reduce((sum, w) => sum + w.length, 0);
    const avgLength = totalLength / cleanedWords.length;
    if (avgLength > 15 || avgLength < 2) {
      flags.push("The word patterns don't match natural language.");
    }
  }

  // 5. Repeated character ratio check
  const textWithoutSpaces = text.replace(/\s/g, '');
  if (textWithoutSpaces.length > 0) {
    const charCounts: Record<string, number> = {};
    for (const char of textWithoutSpaces) {
      const lower = char.toLowerCase();
      charCounts[lower] = (charCounts[lower] || 0) + 1;
    }
    const maxCount = Math.max(...Object.values(charCounts));
    const charRatio = maxCount / textWithoutSpaces.length;
    if (charRatio > 0.25) {
      flags.push('The text contains excessive character repetition.');
    }
  }

  // Return gibberish if 2 or more checks flagged the text
  if (flags.length >= 2) {
    return {
      isGibberish: true,
      reason: flags[0],
    };
  }

  return {
    isGibberish: false,
    reason: '',
  };
}
