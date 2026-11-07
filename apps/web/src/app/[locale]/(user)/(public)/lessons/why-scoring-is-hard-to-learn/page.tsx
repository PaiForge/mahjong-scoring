/**
 * 点数計算ができるようにならない理由
 *
 * @description
 * 作者が点数計算を覚えるまでにつまずいた 3 つの理由を書いたコラム。目次では
 * 「このアプリについて」の直後に差し込むが、レッスンではない — 完了を持たず、
 * 進捗・「次はここから」・前後のレッスンへのリンクにも数えない（`ChapterKind`）。
 *
 * 以前は「このアプリについて」の前半だった。理由を順に読ませてから設計を
 * 説明する流れは筋が通るが、アプリの概要を知りたい人に長い前置きを読ませる
 * ことになるため、結論（アプリの特徴）を先に置き、理由はこちらへ分けた。
 *
 * @flow
 * 1. 目次か「このアプリについて」の本文のリンクから来る
 * 2. 末尾のリンクで「このアプリについて」へ、前後のリンクで順路のレッスンへ戻る
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { WhyScoringIsHardToLearnGuide } from "./_components/why-scoring-is-hard-to-learn-guide";

export function generateMetadata() {
  return createLearnMetadata("why-scoring-is-hard-to-learn");
}

export default function LearnWhyScoringIsHardToLearnPage() {
  return (
    <LearnPageLayout slug="why-scoring-is-hard-to-learn">
      <WhyScoringIsHardToLearnGuide />
    </LearnPageLayout>
  );
}
