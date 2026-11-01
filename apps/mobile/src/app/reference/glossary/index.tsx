import { useTranslations } from "use-intl";

import { Screen } from "../../../components/screen";
import { GlossaryIndexBody } from "../../../reference/glossary-index-body";

/**
 * 用語集
 *
 * @description
 * 点数計算に出てくる麻雀の専門用語の一覧（web の `/reference/glossary`）。
 * 早見表のタブの「用語集」と同じ本文を、今の画面の上に積んで出す（タブへ
 * 移ると読んでいたレッスンから離れるため）。
 *
 * @flow
 * レッスン本文の用語のシートから来て、分類か五十音で目的の語を探し、
 * 用語の画面へ進む。
 */
export default function GlossaryIndexScreen() {
  const t = useTranslations("glossary");
  return (
    <Screen title={t("title")} back>
      <GlossaryIndexBody />
    </Screen>
  );
}
