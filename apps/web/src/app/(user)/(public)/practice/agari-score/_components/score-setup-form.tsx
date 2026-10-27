"use client";

import { useState, useMemo, type ReactNode } from "react";
import { SettingCard } from "../../_components/setting-card";
import { toggleInArray } from "@mahjong-scoring/features/practice/toggle-in-array";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";
import type { ScoreRange } from "@mahjong-scoring/core";
import { useAgariScoreSettingsStore } from "../_hooks/use-agari-score-settings-store";
import { useAgariScoreStore } from "../_hooks/use-agari-score-store";
import { useTrainingSettingsStore } from "@/app/_hooks/use-training-settings-store";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { MultiSelect } from "@/app/(user)/_components/multi-select";
import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";
import { buildScorePracticeQuery } from "../_lib/build-practice-query";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { SettingToggle, SettingToggleGroup } from "./setting-toggle";
import { SmallCheckbox } from "./small-checkbox";
import { ScoreSetupFormSkeleton } from "./score-setup-form-skeleton";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { Button } from "@/app/(user)/_components/button";
import { useAuth } from "@/app/_contexts/auth-context";
import {
  hasPracticeTools as hasPracticeToolsBenefit,
  PLAN_PAGE_HREF,
} from "@mahjong-scoring/features/billing/plans";

interface ScoreSetupFormProps {
  /**
   * 設定の保存先。既定は和了形の点数計算のもの。聴牌形の点数計算は自分の
   * ストアを渡し、同じ画面で別の保存名の設定を編集する
   */
  readonly settingsStore?: typeof useAgariScoreSettingsStore;
  /** 「開始する」で遷移する play ページのパス。既定は和了形の点数計算 */
  readonly playPath?: string;
  /**
   * 「開始する」で遷移する直前に呼ぶ処理。前回の問題をストアから消して
   * play ページを初期状態から始めるために使う。既定は和了形の点数計算のストアを消す
   */
  readonly onStart?: () => void;
  /** 出題する役の絞り込みカードを出すか（既定 true） */
  readonly showYakuFilter?: boolean;
  /** 開始ボタンの下に添える注記（出題範囲の但し書きなど） */
  readonly children?: ReactNode;
}

/**
 * 点数計算練習の設定画面
 * 練習設定画面
 *
 * 和了形の点数計算と聴牌形の点数計算で共有する。設定項目（役の回答・5翻以上の
 * 翻数回答・符の入力・自動で次へ・親子・点数帯）は同じで、保存先と遷移先だけが
 * 練習ごとに違う。
 */
export function ScoreSetupForm({
  settingsStore = useAgariScoreSettingsStore,
  playPath = "/practice/agari-score/play",
  onStart = () => useAgariScoreStore.getState().setQuestion(undefined),
  showYakuFilter = true,
  children,
}: ScoreSetupFormProps = {}) {
  const t = useTranslations("agariScore");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const mounted = useIsClient();
  const [showExactHanInfo, setShowExactHanInfo] = useState(false);
  // 拡張機能（回答時間の計測）は Pro の特典。閲覧者の特典はログイン時に
  // `/api/profile/me` が返す（静的ページなのでサーバーから props では渡せない）。
  // 盤面は特典の有無をサーバーの返事で改めて確かめるので、ここの判定は
  // 「スイッチを出すか料金ページへの導線を出すか」の見た目だけを決める
  const { user, isLoading, profile, isProfileLoading } = useAuth();
  const hasPracticeTools = profile
    ? hasPracticeToolsBenefit(profile.benefits)
    : false;
  // 特典の有無が決まるまではスケルトンを出す。ロック行はスイッチ行より背が高く、
  // 決まる前に描くと Pro の閲覧者にロック行が一瞬出てから縮む
  const isBenefitPending = isLoading || (user !== null && isProfileLoading);
  const useSettingsStore = settingsStore;
  const {
    requireYaku,
    setRequireYaku,
    requireHanFu,
    setRequireHanFu,
    exactHan,
    setExactHan,
    requireFuForMangan,
    setRequireFuForMangan,
    targetScoreRanges,
    setTargetScoreRanges,
    measureTime,
    setMeasureTime,
    includeParent,
    setIncludeParent,
    includeChild,
    setIncludeChild,
    targetYaku,
    setTargetYaku,
  } = useSettingsStore();
  // 「正解したら自動で次へ」はトレーニングと共通の設定で、練習ごとの保存先
  // （settingsStore）には持たない。設定ページは会員限定なので、未ログインでも
  // 切り替えられるようここにもスイッチを置き、同じ値を読み書きする
  const autoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.autoAdvanceOnCorrect,
  );
  const setAutoAdvanceOnCorrect = useTrainingSettingsStore(
    (s) => s.setAutoAdvanceOnCorrect,
  );
  const tSettings = useTranslations("settings");
  const tPicker = useTranslations("common.yakuPicker");
  const yakuLabelOf = useYakuLabel();

  // 表示名の解決は回答フォームの役選択と同じ経路（useYakuLabel）を使う。
  // 並びは allowlist の定義順（実戦出現率順）で固定し、ユーザーの並び替え
  // 設定（useYakuOptions）は適用しない（選択肢が13個しかなく、探すコストより
  // 2画面で並びが揃わない混乱のほうが小さいため）
  const yakuFilterOptions = useMemo(
    () =>
      SCORE_FILTERABLE_YAKU.map((name) => ({
        value: name,
        label: yakuLabelOf(name),
      })),
    [yakuLabelOf],
  );

  const handleStart = () => {
    onStart();
    const queryString = buildScorePracticeQuery(
      {
        requireYaku,
        requireHanFu,
        exactHan,
        requireFuForMangan,
        measureTime,
        targetScoreRanges,
        includeParent,
        includeChild,
        targetYaku,
      },
      { hasPracticeTools, includeYakuFilter: showYakuFilter },
    );
    router.push(queryString ? `${playPath}?${queryString}` : playPath);
  };

  // メモ化は React Compiler に任せる（ストアが props で差し替わるため、
  // 手書きの useCallback は依存の追跡をコンパイラが保証できない）
  const handleToggleRange = (range: ScoreRange) => {
    setTargetScoreRanges(toggleInArray(targetScoreRanges, range));
  };
  const handleToggleNonMangan = () => handleToggleRange("nonMangan");
  const handleToggleManganPlus = () => handleToggleRange("manganPlus");

  const isDisabled =
    targetScoreRanges.length === 0 || (!includeParent && !includeChild);

  if (!mounted || isBenefitPending) {
    return (
      <ScoreSetupFormSkeleton showYakuFilter={showYakuFilter}>
        {children}
      </ScoreSetupFormSkeleton>
    );
  }

  return (
    // 要素間の余白を ContentContainer カードのパディング（p-4 sm:p-6 md:p-8）と同じ
    // レスポンシブ値に揃える。SectionTitle との間隔も親（page.tsx）の space-y が担う。
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <SettingCard title={t("setup.answerItems")} flush>
        <SettingToggle
          checked={requireYaku}
          onChange={setRequireYaku}
          label={t("setup.requireYaku")}
        />
        {/* 細目を開いても親の行との間に線を引かない（細目の囲みが続く） */}
        <SettingToggle
          checked={requireHanFu}
          onChange={setRequireHanFu}
          label={t("setup.requireHanFu")}
          isLast={true}
        />
        {/* 翻数と符の答え方の細目。翻数と符を答えないときは意味が無いので出さない */}
        {requireHanFu && (
          <SettingToggleGroup isLast={true}>
            <SettingToggle
              checked={exactHan}
              onChange={setExactHan}
              label={t("setup.exactHan")}
              onInfoClick={() => setShowExactHanInfo(true)}
              infoAriaLabel={tCommon("showDetailInfo")}
              nested={true}
            />
            <SettingToggle
              checked={requireFuForMangan}
              onChange={setRequireFuForMangan}
              label={t("setup.requireFu")}
              nested={true}
            />
          </SettingToggleGroup>
        )}
      </SettingCard>

      <SettingCard title={t("setup.practiceAids")} flush>
        <SettingToggle
          checked={autoAdvanceOnCorrect}
          onChange={setAutoAdvanceOnCorrect}
          title={tSettings("autoAdvanceOnCorrectTitle")}
          label={tSettings("autoAdvanceOnCorrectTitle")}
        />
        {/* 回答時間の計測は Pro の拡張機能。Pro でなければスイッチの代わりに
            利用条件と料金ページへの導線を出す（押せないスイッチは「壊れている」に見える）。
            未ログインでも導線は料金ページに統一する（機能と料金を見てから
            購入に要るログイン・登録へ進む順序にするため） */}
        <SettingToggle
          checked={measureTime && hasPracticeTools}
          onChange={setMeasureTime}
          label={t("setup.measureTime")}
          isLast={true}
          locked={
            hasPracticeTools
              ? undefined
              : {
                  badge: t("setup.measureTimePro.badge"),
                  note: t("setup.measureTimePro.note"),
                  linkLabel: t("setup.measureTimePro.link"),
                  href: PLAN_PAGE_HREF,
                }
          }
        />
      </SettingCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Question mode */}
        <SettingCard title={t("setup.questionMode")}>
          <SmallCheckbox
            checked={includeParent}
            onChange={setIncludeParent}
            label={t("setup.oya")}
          />
          <SmallCheckbox
            checked={includeChild}
            onChange={setIncludeChild}
            label={t("setup.ko")}
          />
        </SettingCard>

        {/* Target score ranges */}
        <SettingCard title={t("setup.targetScore")}>
          <SmallCheckbox
            checked={targetScoreRanges.includes("nonMangan")}
            onChange={handleToggleNonMangan}
            label={t("setup.nonMangan")}
          />
          <SmallCheckbox
            checked={targetScoreRanges.includes("manganPlus")}
            onChange={handleToggleManganPlus}
            label={t("setup.manganPlus")}
          />
        </SettingCard>
      </div>

      {/* Target yaku: 選んだ役のいずれかが成立する手牌に絞る（空 = 絞り込みなし）。
          選択肢は生成器が安定して作れる役（SCORE_FILTERABLE_YAKU）に限る */}
      {showYakuFilter && (
        <SettingCard title={t("setup.targetYaku")}>
          <MultiSelect
            options={yakuFilterOptions}
            value={targetYaku}
            onChange={setTargetYaku}
            placeholder={t("setup.yakuFilterPlaceholder")}
            labels={{
              add: tPicker("add"),
              title: tPicker("title"),
              done: tPicker("done"),
            }}
          />
          {/* 選んだ役を 1 つずつ × で外す手間を省く。外すと「指定しない」に戻る */}
          {targetYaku.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-surface-500">
                {targetYaku.length >= 2 && t("setup.yakuFilterNote")}
              </p>
              <button
                type="button"
                onClick={() => setTargetYaku([])}
                className={`shrink-0 text-xs ${TEXT_LINK_CLASSES}`}
              >
                {t("setup.yakuFilterClear")}
              </button>
            </div>
          )}
        </SettingCard>
      )}

      {/* Start button */}
      <div>
        <Button
          onClick={handleStart}
          disabled={isDisabled}
          size="lg"
          fullWidth
          className="gap-2"
        >
          <PlayIcon className="size-4" />
          {t("setup.start")}
        </Button>
      </div>

      {children}

      <InfoModal
        isOpen={showExactHanInfo}
        onClose={() => setShowExactHanInfo(false)}
        title={t("setup.exactHan")}
        closeLabel={tCommon("close")}
      >
        {t("setup.exactHanInfo")}
      </InfoModal>
    </div>
  );
}
