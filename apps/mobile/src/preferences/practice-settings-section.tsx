import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  PREFERENCE_ANCHORS,
  type PreferenceAnchor,
} from "@mahjong-scoring/features/settings/preference-anchors";
import {
  MYPAGE_PLAN_PATH,
  YAKU_ORDER_PATH,
} from "@mahjong-scoring/features/routes";

import { useAuth } from "../auth/use-auth";
import { IAP_AVAILABLE } from "../billing/iap-availability";
import { usePlan } from "../billing/use-plan";
import { Divider } from "../components/divider";
import {
  SettingLinkRow,
  SettingLockedRow,
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import {
  useDisplaySettingsStore,
  useKoTsumoInput,
  useScoreInput,
  useTileOrderSetting,
  useTileOrientationSetting,
} from "../hooks/use-display-settings-store";
import {
  useAutoAdvanceOnCorrect,
  useTrainingSettingsStore,
} from "../hooks/use-training-settings-store";
import {
  resolvePracticeToolsAccess,
  type PracticeToolsAccess,
} from "./practice-tools-access";

/**
 * 練習設定セクション
 *
 * 問題を解く画面での進め方・答え方・盤面の見せ方を切り替える節（web の
 * `PracticeSettingsSection`）。自動で次へはトレーニング（模試を含む）と点数計算の
 * 演習だけ、入力方式と盤面の見せ方は昇級試験の本番にも効く。どれも端末ローカルに保存し、
 * 出題内容も受け付ける回答も変えない。
 *
 * 節は画面の分類で、ストアの分け方とは一致させない。正解したら自動で次へは
 * トレーニング設定ストア、ほかの行は表示設定ストアの項目で、表示設定ストアの
 * 項目はこの節と「表示」の節に跨る。ストアを節に合わせて分け直すと保存形式
 * （保存名・項目）が変わり、端末に残った設定を読めなくなるので分け直さない。
 *
 * 節の名前を「トレーニング」にしないのは、トレーニングが時間無制限の練習だけを
 * 指す語だから。点数の入力方式はチャレンジ（昇級試験を含む）にも効くので、両方を
 * 含む「練習」と呼ぶ。
 *
 * 行の順は 進め方 → 答え方 → 盤面 → 別画面へのリンク。
 */
export function PracticeSettingsSection() {
  const t = useTranslations("settings");
  const router = useRouter();
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  const setAutoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.setAutoAdvanceOnCorrect,
  );
  const scoreInput = useScoreInput();
  const setScoreInput = useDisplaySettingsStore((s) => s.setScoreInput);
  const koTsumoInput = useKoTsumoInput();
  const setKoTsumoInput = useDisplaySettingsStore((s) => s.setKoTsumoInput);

  return (
    <SettingsCard>
      {/* 進め方。トレーニングの正解後の進み方だけを変え、チャレンジ（制限時間あり）
          には影響しない */}
      <SettingToggleRow
        title={t("autoAdvanceOnCorrectTitle")}
        description={t("autoAdvanceOnCorrectDescription")}
        checked={autoAdvanceOnCorrect}
        onChange={setAutoAdvanceOnCorrect}
        anchor={PREFERENCE_ANCHORS.autoAdvanceOnCorrect}
      />
      {/* 答え方。タイルが既定なので、スイッチは「選択欄から選ぶ」の向きで出す */}
      <SettingToggleRow
        title={t("scoreInputTitle")}
        description={t("scoreInputDescription")}
        checked={scoreInput === "select"}
        onChange={(checked) => setScoreInput(checked ? "select" : "tiles")}
        testID="preferences-score-input"
        anchor={PREFERENCE_ANCHORS.scoreInput}
      />
      {/* 上の行がオンのときだけ効くので、その直下に置く。
          組の 1 つの選択欄が既定なので、スイッチは「分けて選ぶ」の向きで出す。
          タイルで答える間（上の行がオフ）は効かないが、行は隠さず無効にもしない
          （web と同じ。リンクの着地先を残し、押せないスイッチは壊れて見える）。
          効く条件は説明文で示す */}
      <SettingToggleRow
        title={t("koTsumoInputTitle")}
        description={t("koTsumoInputDescription")}
        checked={koTsumoInput === "split"}
        onChange={(checked) => setKoTsumoInput(checked ? "split" : "combined")}
        anchor={PREFERENCE_ANCHORS.koTsumoInput}
      />
      {/* 盤面の見せ方。Pro の 2 行は隣り合わせ、鍵の行をまとめる。
          Pro は iOS だけで扱う（Android は行を出さず、盤面も常に正規の向き・理牌した順） */}
      {IAP_AVAILABLE && <PracticeToolsRows />}
      {/* 別画面へのリンクは節の末尾に置く。
          36役を並び替える UI は設定画面に置くと長すぎるため専用画面へ渡す */}
      <SettingLinkRow
        onPress={() => router.push(YAKU_ORDER_PATH)}
        title={t("yakuOrderTitle")}
        description={t("yakuOrderDescription")}
      />
    </SettingsCard>
  );
}

/**
 * Pro（`practice_tools`）の行の並び（iOS だけ）
 * Pro 設定行群
 *
 * 回答時間の計測の行と同じ形。Pro ならスイッチ、そうでなければ鍵の掛かった行で、
 * ログイン中ならプラン画面へ、ゲストならログインへ送る。保存値は特典が無い間も
 * 書き換えない。練習の盤面は開始時に特典を読み直して決めるので、ここでの表示
 * （プラン画面と同じ読み取り）とは独立している。
 */
function PracticeToolsRows() {
  const { status, user } = useAuth();
  if (status === "signedIn" && user !== undefined)
    return <SignedInPracticeToolsRows userId={user.id} />;
  return <PracticeToolsRowsFor access="signedOut" />;
}

/**
 * ログイン中の Pro の行の並び
 *
 * プランはここで 1 回だけ読み、全部の行で共有する（`usePlan` はインスタンスごとに
 * 読むので、行ごとに呼ぶと画面のフォーカス・購入後の読み直しのたびに行数ぶん読む）。
 */
function SignedInPracticeToolsRows({ userId }: { readonly userId: string }) {
  const { state } = usePlan(userId);
  return <PracticeToolsRowsFor access={resolvePracticeToolsAccess(state)} />;
}

/** Pro の行を並べる */
function PracticeToolsRowsFor({
  access,
}: {
  readonly access: PracticeToolsAccess;
}) {
  const t = useTranslations("settings");
  const tileOrientation = useTileOrientationSetting();
  const setTileOrientation = useDisplaySettingsStore(
    (s) => s.setTileOrientation,
  );
  const tileOrder = useTileOrderSetting();
  const setTileOrder = useDisplaySettingsStore((s) => s.setTileOrder);
  return (
    <>
      <PracticeToolsToggleRow
        access={access}
        title={t("tileOrientationTitle")}
        description={t("tileOrientationDescription")}
        checked={tileOrientation === "random"}
        onChange={(checked) =>
          setTileOrientation(checked ? "random" : "upright")
        }
        testID="preferences-tile-orientation"
        anchor={PREFERENCE_ANCHORS.tileOrientation}
      />
      {/* SettingsCard はこの行群を1つの子として扱うため、内部の区切りはここに置く */}
      <Divider tone="row" />
      <PracticeToolsToggleRow
        access={access}
        title={t("tileOrderTitle")}
        description={t("tileOrderDescription")}
        checked={tileOrder === "unsorted"}
        onChange={(checked) => setTileOrder(checked ? "unsorted" : "sorted")}
        testID="preferences-tile-order"
        anchor={PREFERENCE_ANCHORS.tileOrder}
      />
    </>
  );
}

interface PracticeToolsToggleRowProps {
  readonly access: PracticeToolsAccess;
  readonly title: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** スイッチの行の testID。鍵の行は末尾に `-locked` を付ける */
  readonly testID: string;
  readonly anchor: PreferenceAnchor;
}

/**
 * Pro の特典で使える設定の行
 *
 * 特典を読んでいる間は保存値のまま押せないスイッチ、特典が無い・読めなければ鍵の行。
 */
function PracticeToolsToggleRow({
  access,
  title,
  description,
  checked,
  onChange,
  testID,
  anchor,
}: PracticeToolsToggleRowProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  if (access === "locked" || access === "signedOut")
    return (
      <SettingLockedRow
        title={title}
        badge={t("practiceToolsPro.badge")}
        note={t("practiceToolsPro.note")}
        onPress={() =>
          router.push(access === "signedOut" ? "/sign-in" : MYPAGE_PLAN_PATH)
        }
        testID={`${testID}-locked`}
        anchor={anchor}
      />
    );
  return (
    <SettingToggleRow
      title={title}
      description={description}
      checked={checked}
      onChange={onChange}
      disabled={access === "pending"}
      testID={testID}
      anchor={anchor}
    />
  );
}
