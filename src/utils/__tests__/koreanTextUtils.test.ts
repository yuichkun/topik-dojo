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
        highlighted: '읽고 있어요',
        after: '',
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

    // Irregular verb tests
    describe('irregular verbs', () => {
      // ㅂ irregular verbs
      it('should find ㅂ irregular conjugation (춥다 → 추워요)', () => {
        const result = findWordInExample('춥다', '오늘 날씨가 추워요');
        expect(result).toEqual({
          before: '오늘 날씨가 ',
          highlighted: '추워요',
          after: '',
        });
      });

      it('should find ㅂ irregular conjugation (돕다 → 도와요)', () => {
        const result = findWordInExample('돕다', '친구를 도와요');
        expect(result).toEqual({
          before: '친구를 ',
          highlighted: '도와요',
          after: '',
        });
      });

      it('should find ㅂ irregular past tense (어렵다 → 어려웠어요)', () => {
        const result = findWordInExample('어렵다', '시험이 어려웠어요');
        expect(result).toEqual({
          before: '시험이 ',
          highlighted: '어려웠어요',
          after: '',
        });
      });

      // ㅅ irregular verbs
      it('should find ㅅ irregular conjugation (낫다 → 나아요)', () => {
        const result = findWordInExample('낫다', '감기가 나아요');
        expect(result).toEqual({
          before: '감기가 ',
          highlighted: '나아요',
          after: '',
        });
      });

      it('should find ㅅ irregular conjugation (짓다 → 지어요)', () => {
        const result = findWordInExample('짓다', '집을 지어요');
        expect(result).toEqual({
          before: '집을 ',
          highlighted: '지어요',
          after: '',
        });
      });

      // ㅎ irregular verbs
      it('should find ㅎ irregular conjugation (좋다 → 좋아요)', () => {
        const result = findWordInExample('좋다', '날씨가 좋아요');
        expect(result).toEqual({
          before: '날씨가 ',
          highlighted: '좋아요',
          after: '',
        });
      });

      it('should find ㅎ irregular conjugation (빨갛다 → 빨개요)', () => {
        const result = findWordInExample('빨갛다', '사과가 빨개요');
        expect(result).toEqual({
          before: '사과가 ',
          highlighted: '빨개요',
          after: '',
        });
      });

      // 르 irregular verbs
      it('should find 르 irregular conjugation (모르다 → 몰라요)', () => {
        const result = findWordInExample('모르다', '답을 몰라요');
        expect(result).toEqual({
          before: '답을 ',
          highlighted: '몰라요',
          after: '',
        });
      });

      it('should find 르 irregular conjugation (부르다 → 불러요)', () => {
        const result = findWordInExample('부르다', '친구를 불러요');
        expect(result).toEqual({
          before: '친구를 ',
          highlighted: '불러요',
          after: '',
        });
      });

      it('should find 르 irregular past tense (다르다 → 달랐어요)', () => {
        const result = findWordInExample('다르다', '예전과 달랐어요');
        expect(result).toEqual({
          before: '예전과 ',
          highlighted: '달랐어요',
          after: '',
        });
      });
    });

    // Consonant assimilation and 으 insertion
    describe('consonant assimilation and 으 insertion', () => {
      it('should find 으 insertion with consonant ending (먹다 → 먹으면)', () => {
        const result = findWordInExample('먹다', '밥을 먹으면 배가 불러요');
        expect(result).toEqual({
          before: '밥을 ',
          highlighted: '먹으면',
          after: ' 배가 불러요',
        });
      });

      it('should find no 으 insertion with vowel ending (가다 → 가면)', () => {
        const result = findWordInExample('가다', '학교에 가면 친구를 만나요');
        expect(result).toEqual({
          before: '학교에 ',
          highlighted: '가면',
          after: ' 친구를 만나요',
        });
      });

      it('should find 으 insertion in future tense (읽다 → 읽을)', () => {
        const result = findWordInExample('읽다', '내일 읽을 책');
        expect(result).toEqual({
          before: '내일 ',
          highlighted: '읽을',
          after: ' 책',
        });
      });

      it('should find ㄹ ending without 으 (살다 → 살면)', () => {
        const result = findWordInExample('살다', '서울에 살면 편해요');
        expect(result).toEqual({
          before: '서울에 ',
          highlighted: '살면',
          after: ' 편해요',
        });
      });
    });

    // Vowel harmony
    describe('vowel harmony (아/어 selection)', () => {
      it('should find correct 아 form for ㅏ/ㅗ vowels (작다 → 작아요)', () => {
        const result = findWordInExample('작다', '방이 작아요');
        expect(result).toEqual({
          before: '방이 ',
          highlighted: '작아요',
          after: '',
        });
      });

      it('should find correct 어 form for other vowels (크다 → 커요)', () => {
        const result = findWordInExample('크다', '집이 커요');
        expect(result).toEqual({
          before: '집이 ',
          highlighted: '커요',
          after: '',
        });
      });

      it('should find vowel contraction (오다 → 와요)', () => {
        const result = findWordInExample('오다', '친구가 와요');
        expect(result).toEqual({
          before: '친구가 ',
          highlighted: '와요',
          after: '',
        });
      });
    });

    // Contracted forms and edge cases
    describe('contracted forms and edge cases', () => {
      it('should find contracted form (하여 → 해)', () => {
        const result = findWordInExample('하다', '공부해');
        expect(result).toEqual({
          before: '공부',
          highlighted: '해',
          after: '',
        });
      });

      it('should find double consonant (앉다 → 앉아요)', () => {
        const result = findWordInExample('앉다', '의자에 앉아요');
        expect(result).toEqual({
          before: '의자에 ',
          highlighted: '앉아요',
          after: '',
        });
      });

      it('should find compound conjugation (살다 → 살고 있어요)', () => {
        const result = findWordInExample('살다', '서울에 살고 있어요');
        expect(result).toEqual({
          before: '서울에 ',
          highlighted: '살고 있어요',
          after: '',
        });
      });

      it('should find honorific form (주다 → 주세요)', () => {
        const result = findWordInExample('주다', '물 좀 주세요');
        expect(result).toEqual({
          before: '물 좀 ',
          highlighted: '주세요',
          after: '',
        });
      });
    });
  });
});