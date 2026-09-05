/**
 * 結果ブロックの 3 分岐が引く辞書キーの整合性検証
 *
 * @description
 * `AsyncResultBlock` は認証状態と取得結果で `RecordSection` /
 * `SignUpCta` / `RecordUnavailable` を出し分ける。このうち
 * `RecordUnavailable` は取得が失敗したときにしか出ないため、キーが欠けても
 * 通常の動作確認では気づけない。next-intl のキー欠落は描画時まで検出されない
 * ので、ここで突き合わせる。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

/** 3 分岐が t() で引く challenge.record のキー */
const REQUIRED_RECORD_KEYS = [
  // 見出し。3 分岐で同じものを使い、シルエットを揃える
  "sectionTitle",
  // 記録セクション
  "thisTimeLabel",
  "lastLabel",
  "bestLabel",
  "scoreUnit",
  "newBest",
  "firstRecord",
  "viewMyRecords",
  // 読み込み失敗（ブロック全体 / 過去記録の行だけ）
  "loadFailed",
  "loadFailedDescription",
  "comparisonLoadFailed",
] as const;

describe("i18n integrity: challenge.record（結果ブロック）", () => {
  it.each(REQUIRED_RECORD_KEYS)("%s が定義されている", (key) => {
    expect(Reflect.get(messagesJson.challenge.record, key)).toBeTypeOf(
      "string",
    );
  });

  it("読み込み失敗の文言が登録を勧めていない", () => {
    // ログイン済みかどうかが判らないまま出る面なので、「登録すれば記録される」
    // と読める文言を置くと、記録されている側の人を誤解させる
    const { loadFailed, loadFailedDescription } = messagesJson.challenge.record;

    expect(`${loadFailed}${loadFailedDescription}`).not.toMatch(/登録/);
  });
});
