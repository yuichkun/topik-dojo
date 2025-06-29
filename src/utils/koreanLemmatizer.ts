/**
 * Simple Korean lemmatizer for finding dictionary forms
 * This is a minimal implementation focusing on common patterns
 */

// Common particles to remove
const PARTICLES = [
  // Case particles
  '이', '가',     // subject
  '을', '를',     // object
  '은', '는',     // topic
  '의',          // possessive
  // Location particles
  '에', '에서',   // at/in
  '으로', '로',   // to/by
  '에게', '한테', // to (person)
  '께',          // to (honorific)
  // Other common particles
  '과', '와',     // and/with
  '도',          // also
  '만',          // only
  '부터', '까지', // from/until
  '마다',        // every
];

// Common verb/adjective endings
const ENDINGS = [
  // Polite endings
  '아요', '어요', '여요', '해요',
  '았어요', '었어요', '였어요', '했어요',
  '을 거예요', 'ㄹ 거예요',
  
  // Formal endings
  '습니다', 'ㅂ니다',
  '았습니다', '었습니다', '였습니다',
  
  // Casual endings
  '아', '어', '여', '해',
  '았어', '었어', '였어', '했어',
  
  // Other common endings
  '고', '서', '니까', '면', '지만',
  '네요', '군요', '는데', 'ㄴ데',
];

/**
 * Generate possible dictionary forms (lemmas) for a Korean word
 * @param word The conjugated or inflected word
 * @returns Array of possible dictionary forms
 */
export function guessLemmas(word: string): string[] {
  const candidates = new Set<string>();
  
  // Always include the original word
  candidates.add(word);
  
  // Remove punctuation
  const cleanWord = word.replace(/[.,!?~]/g, '');
  if (cleanWord !== word) {
    candidates.add(cleanWord);
  }
  
  // Try removing particles first
  let stem = cleanWord;
  for (const particle of PARTICLES) {
    if (cleanWord.endsWith(particle)) {
      stem = cleanWord.slice(0, -particle.length);
      candidates.add(stem);
      break; // Only remove one particle
    }
  }
  
  // Try to generate verb/adjective dictionary forms
  // Check for common endings and try to create dictionary form
  for (const ending of ENDINGS) {
    if (stem.endsWith(ending)) {
      const verbStem = stem.slice(0, -ending.length);
      if (verbStem.length > 0) {
        // Add 다 to create dictionary form
        candidates.add(verbStem + '다');
        
        // Also try adding 하다 for potential 하다 verbs
        candidates.add(verbStem + '하다');
      }
    }
  }
  
  // Special handling for some patterns
  // ㅂ니다/습니다 endings
  if (stem.endsWith('ㅂ니다')) {
    const verbStem = stem.slice(0, -3);
    candidates.add(verbStem + '다');
  }
  
  // Handle 해요/해 -> 하다
  if (stem === '해요' || stem === '해') {
    candidates.add('하다');
  }
  
  // If no endings matched, try adding 다 anyway (might be a stem)
  if (stem.length > 0 && !stem.endsWith('다')) {
    candidates.add(stem + '다');
  }
  
  return Array.from(candidates);
}

/**
 * Segment Korean text into words (simple space-based tokenization)
 * @param text The text to segment
 * @returns Array of word segments
 */
export function segmentKoreanText(text: string): string[] {
  // Split by whitespace and filter empty strings
  return text.split(/\s+/).filter(segment => segment.length > 0);
}