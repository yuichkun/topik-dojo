import { disassemble, assemble } from 'es-hangul';

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
  { pattern: '고 있어요', type: 'progressive_polite' },
  { pattern: '고 있어', type: 'progressive_casual' },
  { pattern: '고 있습니다', type: 'progressive_formal' },
  { pattern: '고 있', type: 'progressive' },
  { pattern: '고 계세요', type: 'progressive_honorific' },
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
  { pattern: '으면', type: 'if_consonant' },
  { pattern: '면', type: 'if' },
  { pattern: '지만', type: 'but' },
  { pattern: '게', type: 'adverb' },
  { pattern: '기', type: 'nominalization' },
  { pattern: '세요', type: 'honorific' },
  { pattern: '으세요', type: 'honorific_consonant' },
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

// Check if the stem ends with a consonant (has 종성)
function endsWithConsonant(stem: string): boolean {
  if (!stem || stem.length === 0) return false;
  const lastChar = stem[stem.length - 1];
  const decomposed = disassemble(lastChar);
  // A character has consonant ending if it has 3 components (초성, 중성, 종성)
  return decomposed.length === 3;
}

// Get the last consonant (종성) of a stem
function getLastConsonant(stem: string): string | null {
  if (!stem || stem.length === 0) return null;
  const lastChar = stem[stem.length - 1];
  const decomposed = disassemble(lastChar);
  return decomposed.length === 3 ? decomposed[2] : null;
}

// Handle ㅂ irregular verbs
function handleBIrregular(stem: string): string | null {
  const lastConsonant = getLastConsonant(stem);
  if (lastConsonant === 'ㅂ') {
    // Special case for 돕다 and 곱다 which become 도와, 고와
    if (stem === '돕' || stem === '곱') {
      const lastChar = stem[stem.length - 1];
      const decomposed = disassemble(lastChar);
      // Remove 종성 (ㅂ) and rebuild
      const newChar = assemble([decomposed[0], decomposed[1]]);
      return stem.slice(0, -1) + newChar + '오';
    }
    
    // Regular ㅂ irregular: Remove the last character and rebuild without ㅂ
    const withoutLast = stem.slice(0, -1);
    const lastChar = stem[stem.length - 1];
    const decomposed = disassemble(lastChar);
    // Remove 종성 (ㅂ)
    const newChar = assemble([decomposed[0], decomposed[1]]);
    return withoutLast + newChar + '우';
  }
  return null;
}

// Handle ㅅ irregular verbs
function handleSIrregular(stem: string): string | null {
  const lastConsonant = getLastConsonant(stem);
  if (lastConsonant === 'ㅅ') {
    // Remove ㅅ from the stem
    const withoutLast = stem.slice(0, -1);
    const lastChar = stem[stem.length - 1];
    const decomposed = disassemble(lastChar);
    // Remove 종성 (ㅅ)
    const newChar = assemble([decomposed[0], decomposed[1]]);
    return withoutLast + newChar;
  }
  return null;
}

// Handle ㅎ irregular verbs (mainly for color adjectives)
function handleHIrregular(stem: string): string | null {
  if (stem.endsWith('갛') || stem.endsWith('랗') || stem.endsWith('렇') || stem.endsWith('뻣')) {
    // For 빨갛다 → 빨개요, 파랗다 → 파래요, etc.
    const withoutLast = stem.slice(0, -1);
    const lastChar = stem[stem.length - 1];
    const decomposed = disassemble(lastChar);
    // Change the vowel ㅏ to ㅐ
    if (decomposed[1] === 'ㅏ') {
      const newChar = assemble([decomposed[0], 'ㅐ']);
      return withoutLast + newChar;
    }
  }
  return null;
}

// Handle 르 irregular verbs
function handleReuIrregular(stem: string): { base: string; doubled: string } | null {
  if (stem.endsWith('르')) {
    const withoutReu = stem.slice(0, -1);
    const beforeReu = withoutReu[withoutReu.length - 1];
    if (beforeReu) {
      const decomposed = disassemble(beforeReu);
      // Add ㄹ as 종성
      let doubledChar;
      if (decomposed.length === 2) {
        // No 종성, add ㄹ
        doubledChar = assemble([decomposed[0], decomposed[1], 'ㄹ']);
      } else {
        // Already has 종성, just return null (not a regular 르 pattern)
        return null;
      }
      const base = withoutReu.slice(0, -1) + doubledChar;
      
      // Determine if we need 라 or 러 based on vowel
      const vowel = decomposed[1];
      const needsA = vowel === 'ㅏ' || vowel === 'ㅗ';
      const conjugated = base + (needsA ? '라' : '러');
      
      return { base, doubled: conjugated };
    }
  }
  return null;
}

// Determine whether to use 아 or 어 based on the last vowel
function getVowelHarmony(stem: string): 'ㅏ' | 'ㅓ' {
  if (!stem || stem.length === 0) return 'ㅓ';
  
  // Check the last vowel in the stem
  for (let i = stem.length - 1; i >= 0; i--) {
    const decomposed = disassemble(stem[i]);
    const vowel = decomposed[1]; // 중성 (vowel)
    
    // ㅏ or ㅗ uses 아
    if (vowel === 'ㅏ' || vowel === 'ㅗ') {
      return 'ㅏ';
    }
    // Any other vowel uses 어
    if (vowel) {
      return 'ㅓ';
    }
  }
  return 'ㅓ';
}

// Handle vowel contractions (오 + 아 = 와, 우 + 어 = 워, etc.)
function handleVowelContraction(stem: string, vowelType: 'ㅏ' | 'ㅓ'): string | null {
  if (!stem || stem.length === 0) return null;
  
  const lastChar = stem[stem.length - 1];
  const decomposed = disassemble(lastChar);
  
  // Only process if no 종성 (consonant ending)
  if (decomposed.length === 2) {
    const consonant = decomposed[0];
    const vowel = decomposed[1];
    
    // Handle contractions
    if (vowel === 'ㅗ' && vowelType === 'ㅏ') {
      // 오 + 아 = 와
      return stem.slice(0, -1) + assemble([consonant, 'ㅘ']);
    } else if (vowel === 'ㅜ' && vowelType === 'ㅓ') {
      // 우 + 어 = 워
      return stem.slice(0, -1) + assemble([consonant, 'ㅝ']);
    } else if (vowel === 'ㅡ' && vowelType === 'ㅓ') {
      // 크 + 어 = 커
      return stem.slice(0, -1) + assemble([consonant, 'ㅓ']);
    } else if (vowel === 'ㅣ' && vowelType === 'ㅓ') {
      // Some verbs like 마시다 → 마셔
      return stem.slice(0, -1) + assemble([consonant, 'ㅕ']);
    }
  }
  
  return null;
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
    
    // Check for irregular verbs first
    // ㅂ irregular
    const bIrregularStem = handleBIrregular(stem);
    if (bIrregularStem) {
      let patterns;
      let baseWithoutU;
      
      // Special handling for 돕다/곱다 which use 오 instead of 우
      if (stem === '돕' || stem === '곱') {
        patterns = [
          { search: '와요', pattern: '와요' },  // 오 + 아요 = 와요
          { search: '와', pattern: '와' },      // 오 + 아 = 와
          { search: '왔어요', pattern: '왔어요' }, // 오 + 았어요 = 왔어요
          { search: '왔어', pattern: '왔어' },   // 오 + 았어 = 왔어
          { search: '왔습니다', pattern: '왔습니다' }, // 오 + 았습니다 = 왔습니다
        ];
        baseWithoutU = bIrregularStem.slice(0, -1); // Remove 오 from 도오 to get 도
      } else {
        // Regular ㅂ irregular creates 우 which contracts with following vowels
        patterns = [
          { search: '워요', pattern: '워요' },  // 우 + 어요 = 워요
          { search: '워', pattern: '워' },      // 우 + 어 = 워
          { search: '웠어요', pattern: '웠어요' }, // 우 + 었어요 = 웠어요
          { search: '웠어', pattern: '웠어' },   // 우 + 었어 = 웠어
          { search: '웠습니다', pattern: '웠습니다' }, // 우 + 었습니다 = 웠습니다
        ];
        baseWithoutU = bIrregularStem.slice(0, -1); // Remove 우
      }
      
      for (const { search } of patterns) {
        const searchStr = baseWithoutU + search;
        const index = example.indexOf(searchStr);
        if (index !== -1) {
          return {
            before: example.substring(0, index),
            highlighted: searchStr,
            after: example.substring(index + searchStr.length),
          };
        }
      }
    }
    
    // ㅅ irregular
    const sIrregularStem = handleSIrregular(stem);
    if (sIrregularStem) {
      // Determine vowel harmony for ㅅ irregular
      const vowelType = getVowelHarmony(sIrregularStem);
      const vowelChar = vowelType === 'ㅏ' ? '아' : '어';
      
      const patterns = [
        { search: vowelChar + '요', pattern: vowelChar + '요' },
        { search: vowelChar, pattern: vowelChar },
        { search: vowelChar + '써요', pattern: vowelChar + '써요' }, // past tense
        { search: vowelChar + '써', pattern: vowelChar + '써' },
      ];
      
      for (const { search } of patterns) {
        const searchStr = sIrregularStem + search;
        const index = example.indexOf(searchStr);
        if (index !== -1) {
          return {
            before: example.substring(0, index),
            highlighted: searchStr,
            after: example.substring(index + searchStr.length),
          };
        }
      }
    }
    
    // ㅎ irregular (color adjectives)
    const hIrregularStem = handleHIrregular(stem);
    if (hIrregularStem) {
      const patterns = ['요', '어요', ''];
      for (const pattern of patterns) {
        const searchStr = hIrregularStem + pattern;
        const index = example.indexOf(searchStr);
        if (index !== -1) {
          return {
            before: example.substring(0, index),
            highlighted: searchStr,
            after: example.substring(index + searchStr.length),
          };
        }
      }
    }
    
    // 르 irregular
    const reuIrregular = handleReuIrregular(stem);
    if (reuIrregular) {
      // Check for present tense forms
      const patterns = ['요', '어요', ''];
      for (const pattern of patterns) {
        const searchStr = reuIrregular.doubled + pattern;
        const index = example.indexOf(searchStr);
        if (index !== -1) {
          return {
            before: example.substring(0, index),
            highlighted: searchStr,
            after: example.substring(index + searchStr.length),
          };
        }
      }
      
      // Check for past tense forms (달랐어요)
      // For 르 irregular past tense, the pattern is 랐/렀 (with ㄹ already in the base)
      const baseIndex = example.indexOf(reuIrregular.base);
      if (baseIndex !== -1) {
        const afterBase = example.substring(baseIndex + reuIrregular.base.length);
        // 르 irregular past tense uses 랐/렀 depending on vowel harmony
        const pastPatterns = reuIrregular.doubled.endsWith('라') 
          ? ['랐어요', '랐어', '랐습니다'] 
          : ['렀어요', '렀어', '렀습니다'];
        
        for (const pattern of pastPatterns) {
          if (afterBase.startsWith(pattern)) {
            return {
              before: example.substring(0, baseIndex),
              highlighted: reuIrregular.base + pattern,
              after: example.substring(baseIndex + reuIrregular.base.length + pattern.length),
            };
          }
        }
      }
    }
    
    // Check for vowel contractions (크다 → 커요, 오다 → 와요)
    const vowelHarmony = getVowelHarmony(stem);
    const contracted = handleVowelContraction(stem, vowelHarmony);
    if (contracted) {
      const patterns = ['요', ''];
      for (const pattern of patterns) {
        const searchStr = contracted + pattern;
        const index = example.indexOf(searchStr);
        if (index !== -1) {
          return {
            before: example.substring(0, index),
            highlighted: searchStr,
            after: example.substring(index + searchStr.length),
          };
        }
      }
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
