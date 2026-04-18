/**
 * カリキュラムと i18n メッセージファイル (ja.json) の整合性検証
 *
 * @description
 * `/learn` 目次・章ナビゲーションでは `CurriculumChapter.i18nKey`（camelCase）
 * を経由して章タイトル・説明を参照する（案C）。
 * slug（kebab-case）は `getChapterI18nPath(chapter)` により camelCase の
 * i18n パスに変換される。本テストは i18nKey と ja.json のキーが一致している
 * ことを検証する。
 */
import { describe, expect, it } from 'vitest';

import messagesJson from '@/messages/ja.json';

import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  getChapterI18nPath,
} from '../curriculum';

const messages = messagesJson as unknown as {
  readonly learnCurriculum: {
    readonly sections: Record<string, string>;
    readonly chapters: Record<string, { title: string; description: string }>;
    readonly index: Record<string, string>;
    readonly chapter: Record<string, string>;
  };
};

describe('i18n integrity: sections', () => {
  it('has a translation for every CURRICULUM_SECTIONS entry', () => {
    for (const section of CURRICULUM_SECTIONS) {
      expect(messages.learnCurriculum.sections[section]).toBeDefined();
    }
  });
});

describe('i18n integrity: chapters (via getChapterI18nPath)', () => {
  /**
   * page.tsx / chapter-nav.tsx は `getChapterI18nPath(chapter)` 経由で
   * "chapters.<camelName>" のパスを組み立て、`t(learnCurriculum.XXX)` スコープ内で
   * 参照する。その変換結果が ja.json の実キーと一致することを検証する。
   */
  it('has a title for every chapter via getChapterI18nPath', () => {
    for (const chapter of CURRICULUM) {
      const path = getChapterI18nPath(chapter);
      // path は "chapters.aboutThisApp" のような "." 区切りの相対パス
      const segments = path.split('.');
      let node: unknown = messages.learnCurriculum;
      for (const seg of segments) {
        node = (node as Record<string, unknown>)?.[seg];
      }
      expect((node as { title?: unknown })?.title).toBeTypeOf('string');
    }
  });

  it('has a description for every chapter via getChapterI18nPath', () => {
    for (const chapter of CURRICULUM) {
      const path = getChapterI18nPath(chapter);
      const segments = path.split('.');
      let node: unknown = messages.learnCurriculum;
      for (const seg of segments) {
        node = (node as Record<string, unknown>)?.[seg];
      }
      expect((node as { description?: unknown })?.description).toBeTypeOf(
        'string',
      );
    }
  });
});

describe('i18n integrity: chapters (via CurriculumChapter.i18nKey)', () => {
  /**
   * `curriculum.ts` 側で定義された i18nKey (camelCase) は
   * ja.json の実際のキーと一致する。こちらは現在 pass する。
   * すなわち「参照側で i18nKey を使う」案Cで整合する。
   */
  it('has a matching message for every i18nKey in CURRICULUM', () => {
    for (const chapter of CURRICULUM) {
      // i18nKey は "learnCurriculum.chapters.<camelName>" 形式
      const segments = chapter.i18nKey.split('.');
      let node: unknown = messages;
      for (const seg of segments) {
        node = (node as Record<string, unknown>)?.[seg];
      }
      expect(node).toBeDefined();
      expect(typeof node).toBe('object');
      expect((node as { title?: unknown }).title).toBeTypeOf('string');
      expect((node as { description?: unknown }).description).toBeTypeOf(
        'string',
      );
    }
  });
});

describe('i18n integrity: chapter UI keys', () => {
  const requiredChapterKeys = [
    'markAsReadCta',
    'markedAsRead',
    'unmarkAsReadCta',
    'unmarkConfirm',
    'loginPromptCta',
    'prevChapterLabel',
    'nextChapterLabel',
    'practiceLinksTitle',
    'practiceLinkCta',
    'updateFailedToast',
  ];

  it.each(requiredChapterKeys)('has learnCurriculum.chapter.%s', (key) => {
    expect(messages.learnCurriculum.chapter[key]).toBeTypeOf('string');
    expect(messages.learnCurriculum.chapter[key]).not.toBe('');
  });
});

describe('i18n integrity: index keys', () => {
  const requiredIndexKeys = [
    'pageTitle',
    'pageDescription',
    'progressLabel',
    'nextChapterBadge',
    'allCompletedMessage',
  ];

  it.each(requiredIndexKeys)('has learnCurriculum.index.%s', (key) => {
    expect(messages.learnCurriculum.index[key]).toBeTypeOf('string');
    expect(messages.learnCurriculum.index[key]).not.toBe('');
  });
});
