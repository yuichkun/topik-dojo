import { findWordInExample } from '../koreanTextUtils';

describe('koreanTextUtils', () => {
  describe('findWordInExample', () => {
    // Exact match cases
    it('should find exact matches', () => {
      const result = findWordInExample('사과', '저는 사과를 좋아해요');
      expect(result).toEqual({
        before: '저는 ',
        highlighted: '사과',
        after: '를 좋아해요',
      });
    });

    it('should return null when word is not found', () => {
      const result = findWordInExample('바나나', '저는 사과를 좋아해요');
      expect(result).toBeNull();
    });

    // Verb conjugation cases
    it('should find past tense conjugation (았어요)', () => {
      const result = findWordInExample('잡다', '아이가 엄마의 손을 꽉 잡았어요');
      expect(result).toEqual({
        before: '아이가 엄마의 손을 꽉 ',
        highlighted: '잡았어요',
        after: '',
      });
    });

    it('should find past tense conjugation (었어요)', () => {
      const result = findWordInExample('먹다', '어제 김치를 먹었어요');
      expect(result).toEqual({
        before: '어제 김치를 ',
        highlighted: '먹었어요',
        after: '',
      });
    });

    it('should find present tense conjugation (아요/어요)', () => {
      const result = findWordInExample('가다', '학교에 가요');
      expect(result).toEqual({
        before: '학교에 ',
        highlighted: '가요',
        after: '',
      });
    });

    it('should find present formal conjugation (습니다)', () => {
      const result = findWordInExample('하다', '공부를 합니다');
      expect(result).toEqual({
        before: '공부를 ',
        highlighted: '합니다',
        after: '',
      });
    });

    it('should find future/modifier form (을/ㄹ)', () => {
      const result = findWordInExample('하다', '할 수 있어요');
      expect(result).toEqual({
        before: '',
        highlighted: '할',
        after: ' 수 있어요',
      });
    });

    it('should find progressive form (고 있다)', () => {
      const result = findWordInExample('읽다', '책을 읽고 있어요');
      expect(result).toEqual({
        before: '책을 ',
        highlighted: '읽고 있',
        after: '어요',
      });
    });

    it('should find connective form (고)', () => {
      const result = findWordInExample('먹다', '밥을 먹고 학교에 갔어요');
      expect(result).toEqual({
        before: '밥을 ',
        highlighted: '먹고',
        after: ' 학교에 갔어요',
      });
    });

    // Grammar pattern cases
    it('should skip grammar patterns starting with －', () => {
      const result = findWordInExample(
        '－(으)라는 거죠?',
        '지금 당장 회의실로 오라는 거죠?'
      );
      expect(result).toBeNull();
    });

    it('should skip grammar patterns starting with -', () => {
      const result = findWordInExample(
        '-(으)ㄴ',
        '예쁜 꽃이 피었어요'
      );
      expect(result).toBeNull();
    });

    // Edge cases
    it('should handle empty strings', () => {
      const result = findWordInExample('', '안녕하세요');
      expect(result).toBeNull();
    });

    it('should handle when example is empty', () => {
      const result = findWordInExample('안녕', '');
      expect(result).toBeNull();
    });

    it('should find stem even without matching conjugation pattern', () => {
      const result = findWordInExample('특별하다', '이것은 특별해');
      expect(result).toEqual({
        before: '이것은 ',
        highlighted: '특별해',
        after: '',
      });
    });

    it('should handle multiple occurrences by finding the first one', () => {
      const result = findWordInExample('하다', '공부를 하고 운동을 해요');
      expect(result).toEqual({
        before: '공부를 ',
        highlighted: '하고',
        after: ' 운동을 해요',
      });
    });

    // Complex conjugations
    it('should find past casual form (았어/었어)', () => {
      const result = findWordInExample('가다', '어제 집에 갔어');
      expect(result).toEqual({
        before: '어제 집에 ',
        highlighted: '갔어',
        after: '',
      });
    });

    it('should find nominalization form (기)', () => {
      const result = findWordInExample('듣다', '음악 듣기를 좋아해요');
      expect(result).toEqual({
        before: '음악 ',
        highlighted: '듣기',
        after: '를 좋아해요',
      });
    });

    it('should find modifier form (는)', () => {
      const result = findWordInExample('먹다', '밥을 먹는 사람');
      expect(result).toEqual({
        before: '밥을 ',
        highlighted: '먹는',
        after: ' 사람',
      });
    });

    // Words that are not verbs/adjectives
    it('should find exact match for nouns', () => {
      const result = findWordInExample('학교', '학교에 갑니다');
      expect(result).toEqual({
        before: '',
        highlighted: '학교',
        after: '에 갑니다',
      });
    });

    it('should handle words that partially match but are not the target', () => {
      const result = findWordInExample('가다', '가방을 가지고 왔어요');
      expect(result).toBeNull();
    });
  });
});