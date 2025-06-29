// Common verb/adjective endings to remove when looking for stems
const VERB_ENDINGS = ['다'];

// Common conjugation patterns for verbs and adjectives
// Order matters - longer patterns should come first
const CONJUGATION_PATTERNS = [
  // Past tense - longer patterns first
  { pattern: '았어요', type: 'past_polite' },
  { pattern: '었어요', type: 'past_polite' },
  { pattern: '였어요', type: 'past_polite' },
  { pattern: '았습니다', type: 'past_formal' },
  { pattern: '었습니다', type: 'past_formal' },
  { pattern: '였습니다', type: 'past_formal' },
  { pattern: '았어', type: 'past_casual' },
  { pattern: '었어', type: 'past_casual' },
  { pattern: '였어', type: 'past_casual' },
  { pattern: '았', type: 'past' },
  { pattern: '었', type: 'past' },
  { pattern: '였', type: 'past' },

  // Present tense
  { pattern: '아요', type: 'present_polite' },
  { pattern: '어요', type: 'present_polite' },
  { pattern: '여요', type: 'present_polite' },
  { pattern: '해요', type: 'present_polite' },
  { pattern: '습니다', type: 'present_formal' },
  { pattern: 'ㅂ니다', type: 'present_formal' },
  { pattern: '아', type: 'present_casual' },
  { pattern: '어', type: 'present_casual' },
  { pattern: '여', type: 'present_casual' },
  { pattern: '해', type: 'present_casual' },

  // Future/presumptive
  { pattern: '을 거예요', type: 'future' },
  { pattern: 'ㄹ 거예요', type: 'future' },
  { pattern: '을 거야', type: 'future_casual' },
  { pattern: 'ㄹ 거야', type: 'future_casual' },
  { pattern: '을', type: 'future_modifier' },
  { pattern: 'ㄹ', type: 'future_modifier' },

  // Progressive
  { pattern: '고 있', type: 'progressive' },
  { pattern: '고 계', type: 'progressive_honorific' },

  // Modifiers
  { pattern: '는', type: 'present_modifier' },
  { pattern: 'ㄴ', type: 'past_modifier' },
  { pattern: '은', type: 'past_modifier' },
  { pattern: '던', type: 'retrospective' },

  // Other common forms
  { pattern: '고', type: 'connective' },
  { pattern: '서', type: 'sequence' },
  { pattern: '니까', type: 'because' },
  { pattern: '면', type: 'if' },
  { pattern: '지만', type: 'but' },
  { pattern: '게', type: 'adverb' },
  { pattern: '기', type: 'nominalization' },
];

// Extract stem from a Korean word (mainly for verbs/adjectives ending in 다)
function extractStem(word: string): string {
  for (const ending of VERB_ENDINGS) {
    if (word.endsWith(ending)) {
      return word.slice(0, -ending.length);
    }
  }
  return word;
}

// Check if a string starts with a grammar pattern marker
function isGrammarPattern(word: string): boolean {
  return word.startsWith('－') || word.startsWith('-');
}

export interface HighlightResult {
  before: string;
  highlighted: string;
  after: string;
}

// Find and highlight a word in an example sentence, handling conjugations
export function findWordInExample(
  word: string,
  example: string,
): HighlightResult | null {
  // Handle empty inputs
  if (!word || !example) {
    return null;
  }

  // Skip grammar patterns
  if (isGrammarPattern(word)) {
    return null;
  }

  // 1. Try exact match first
  const exactIndex = example.indexOf(word);
  if (exactIndex !== -1) {
    return {
      before: example.substring(0, exactIndex),
      highlighted: word,
      after: example.substring(exactIndex + word.length),
    };
  }

  // 2. For verbs/adjectives, try stem-based matching
  let stem = extractStem(word);
  if (stem !== word && stem.length > 0) {
    // Special handling for 하다 verbs
    if (word === '하다' || word.endsWith('하다')) {
      const baseStem = word === '하다' ? '' : word.slice(0, -2);

      // Check for ㅎ irregular forms (합니다, 해요, 했어요, etc.)
      const hPatterns = [
        { pattern: '합니다', highlight: '합니다' },
        { pattern: '합니까', highlight: '합니까' },
        { pattern: '했어요', highlight: '했어요' },
        { pattern: '했어', highlight: '했어' },
        { pattern: '했습니다', highlight: '했습니다' },
        { pattern: '하고', highlight: '하고' },
        { pattern: '하는', highlight: '하는' },
        { pattern: '한', highlight: '한' },
        { pattern: '할', highlight: '할' },
        { pattern: '해요', highlight: '해요' },
        { pattern: '해', highlight: '해' },
      ];

      // Find the first occurrence among all patterns
      let earliestIndex = -1;
      let earliestPattern = null;

      for (const hPattern of hPatterns) {
        const searchStr = baseStem + hPattern.pattern;
        const index = example.indexOf(searchStr);
        if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
          earliestIndex = index;
          earliestPattern = { searchStr, pattern: hPattern };
        }
      }

      if (earliestPattern) {
        return {
          before: example.substring(0, earliestIndex),
          highlighted: earliestPattern.searchStr,
          after: example.substring(
            earliestIndex + earliestPattern.searchStr.length,
          ),
        };
      }

      // Fallback to regular 하 stem
      stem = baseStem + '하';
    }

    // Handle special case for adjectives ending in 하다
    if (stem.endsWith('하')) {
      // Check for forms like 특별해 (하 + 여 → 해)
      const adjStem = stem.slice(0, -1);
      const adjIndex = example.indexOf(adjStem + '해');
      if (adjIndex !== -1) {
        return {
          before: example.substring(0, adjIndex),
          highlighted: adjStem + '해',
          after: example.substring(adjIndex + adjStem.length + 1),
        };
      }
    }

    // Try to find the stem with proper word boundaries
    let searchIndex = 0;
    while (searchIndex < example.length) {
      const stemIndex = example.indexOf(stem, searchIndex);
      if (stemIndex === -1) break;

      // Check if this is actually part of our word's conjugation
      // by verifying it's not part of another word
      const beforeChar = stemIndex > 0 ? example[stemIndex - 1] : ' ';
      const isWordBoundary =
        beforeChar === ' ' || beforeChar === '\n' || stemIndex === 0;

      if (!isWordBoundary) {
        searchIndex = stemIndex + 1;
        continue;
      }

      // Check what follows the stem to verify it's a conjugation
      const afterStem = example.substring(stemIndex + stem.length);

      // First check if there's a conjugation pattern
      for (const pattern of CONJUGATION_PATTERNS) {
        if (afterStem.startsWith(pattern.pattern)) {
          // Found a matching conjugation pattern
          const highlightedLength = stem.length + pattern.pattern.length;
          return {
            before: example.substring(0, stemIndex),
            highlighted: example.substring(
              stemIndex,
              stemIndex + highlightedLength,
            ),
            after: example.substring(stemIndex + highlightedLength),
          };
        }
      }

      // If no pattern matches, check if the stem is followed by a space or punctuation
      // This prevents matching "가" in "가방"
      const afterChar = afterStem.length > 0 ? afterStem[0] : ' ';
      const isEndBoundary =
        afterChar === ' ' ||
        afterChar === '\n' ||
        afterChar === '.' ||
        afterChar === ',' ||
        afterChar === '!' ||
        afterChar === '?' ||
        afterChar === '을' ||
        afterChar === '를' ||
        afterChar === '이' ||
        afterChar === '가' ||
        afterChar === '은' ||
        afterChar === '는' ||
        afterChar === '에' ||
        afterChar === '에서' ||
        afterChar === '으로' ||
        afterChar === '로' ||
        afterChar === '과' ||
        afterChar === '와' ||
        afterChar === '의' ||
        afterChar === '도' ||
        afterStem.length === 0;

      if (isEndBoundary) {
        // If stem is found with proper boundaries but no pattern matches,
        // still highlight just the stem
        return {
          before: example.substring(0, stemIndex),
          highlighted: stem,
          after: example.substring(stemIndex + stem.length),
        };
      }

      searchIndex = stemIndex + 1;
    }

    // Special cases for verbs with consonant changes
    // 가다 can become 갔- in past tense
    if (word === '가다') {
      const specialForms = [
        { stem: '갔', patterns: ['어요', '어', '습니다'] },
        { stem: '가', patterns: ['요'] },
      ];

      for (const form of specialForms) {
        const specialIndex = example.indexOf(form.stem);
        if (specialIndex !== -1) {
          const afterSpecial = example.substring(
            specialIndex + form.stem.length,
          );
          for (const patternStr of form.patterns) {
            if (afterSpecial.startsWith(patternStr)) {
              return {
                before: example.substring(0, specialIndex),
                highlighted: form.stem + patternStr,
                after: example.substring(
                  specialIndex + form.stem.length + patternStr.length,
                ),
              };
            }
          }
        }
      }
    }

    // Special cases for irregular verbs
    // ㄷ irregular: 듣다 → 들어요
    if (stem.endsWith('듣')) {
      const irregularStem = stem.slice(0, -1) + '들';
      const irregularIndex = example.indexOf(irregularStem);
      if (irregularIndex !== -1) {
        const afterIrregular = example.substring(
          irregularIndex + irregularStem.length,
        );
        for (const pattern of CONJUGATION_PATTERNS) {
          if (afterIrregular.startsWith(pattern.pattern)) {
            return {
              before: example.substring(0, irregularIndex),
              highlighted: irregularStem + pattern.pattern,
              after: example.substring(
                irregularIndex + irregularStem.length + pattern.pattern.length,
              ),
            };
          }
        }
      }
    }

    // ㅂ irregular: 춥다 → 추워요
    if (stem.endsWith('ㅂ')) {
      // This would require more complex handling
      // For now, we'll skip these cases
    }

    // ㅅ irregular: 잇다 → 이어요
    if (stem.endsWith('ㅅ')) {
      // This would require more complex handling
      // For now, we'll skip these cases
    }
  }

  // 3. No match found
  return null;
}

// Helper function to check if a word appears in any form in the example
export function wordAppearsInExample(word: string, example: string): boolean {
  return findWordInExample(word, example) !== null;
}
