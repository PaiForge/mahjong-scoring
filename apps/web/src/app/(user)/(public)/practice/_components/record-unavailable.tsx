import { getTranslations } from "next-intl/server";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ResultBlockSection } from "./result-block-section";

/**
 * 記録を読み込めなかったときの結果ブロック
 * 記録読み込み失敗
 *
 * Server Component。結果画面で記録セクション・登録 CTA と同じスロットに出る
 * 3 つ目の分岐で、認証状態を訊けずログイン済みかどうかも判らなかったときに
 * 使う。
 *
 * この分岐が要るのは、失敗を登録 CTA に倒すと嘘になるため。ログイン済みの
 * 人に「無料登録するとスコアが記録されます」と勧めることになり、記録されて
 * いる側の人が記録されていないと受け取る。かといって記録セクションを空欄で
 * 出すと、今度は記録がまだ無い初回の画面と見分けがつかない。読み込めなかった
 * とだけ言うのが、どちらの誤解も生まない唯一の面になる。
 *
 * セクションごと消さずに `ResultBlockSection` の骨格に載せるのは、
 * スケルトンからの置換で他の分岐と同じ高さを保ち、レイアウトを動かさないため。
 * 中身は最小高さ（248px）より低いので、高さを決めているのは引き続き登録 CTA
 * の側であり、この分岐を足しても実測し直す必要はない。
 */
export async function RecordUnavailable() {
  const t = await getTranslations("challenge");

  return (
    <ResultBlockSection>
      <SectionTitle>{t("record.sectionTitle")}</SectionTitle>
      <HighlightPanel>
        <p className="font-semibold text-surface-900">
          {t("record.loadFailed")}
        </p>
        <p className="mt-1 text-sm text-surface-600">
          {t("record.loadFailedDescription")}
        </p>
      </HighlightPanel>
    </ResultBlockSection>
  );
}
