import { useTranslations } from "use-intl";
import { HaiKind, type HaiKindId } from "@mahjong-scoring/core";
import {
  exampleAnkan,
  exampleAnkou,
  exampleMinkan,
  exampleMinkou,
  exampleShuntsu,
} from "@mahjong-scoring/features/board/example-mentsu";

import {
  ChapterColumn,
  PreferenceSettingsNote,
} from "../components/chapter-column";
import {
  ExampleTable,
  FuSummaryTable,
  useExampleTableColumns,
} from "../components/example-table";
import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideNote, GuideParagraph } from "../components/guide-text";
import {
  CELL_TILE_SIZE,
  MachiTiles,
  MentsuSet,
  TileSet,
} from "../components/tile-row";

/** 雀頭の符計算 — 符セクション第 1 章（web の `JantouFuGuide`） */
export function JantouFuGuide() {
  const namespace = "jantouFu.learn";
  const t = useTranslations(namespace);
  const columns = useExampleTableColumns(namespace);
  const pair = (hai: HaiKindId) => (
    <TileSet tiles={[hai, hai]} size={CELL_TILE_SIZE} />
  );

  return (
    <GuideBody>
      <GuideSection title={t("whatIsJantou")}>
        <GuideParagraph>{t("whatIsJantouBody")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("yakuhaiTitle")}>
        <GuideParagraph>{t("yakuhaiBody")}</GuideParagraph>
        <ExampleTable
          title={t("sangenExamples")}
          columns={columns}
          rows={[
            { tiles: pair(HaiKind.Haku), label: t("labelHaku"), fu: 2 },
            { tiles: pair(HaiKind.Hatsu), label: t("labelHatsu"), fu: 2 },
            { tiles: pair(HaiKind.Chun), label: t("labelChun"), fu: 2 },
          ]}
        />
        <ExampleTable
          title={t("kazeExamples")}
          columns={columns}
          rows={[
            { tiles: pair(HaiKind.Ton), label: t("labelBakaze"), fu: 2 },
            { tiles: pair(HaiKind.Nan), label: t("labelJikaze"), fu: 2 },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("noFuTitle")}>
        <GuideParagraph>{t("noFuBody")}</GuideParagraph>
        <ExampleTable
          title={t("noFuExamples")}
          columns={columns}
          rows={[
            {
              tiles: pair(HaiKind.ManZu1),
              label: t("labelSuuhaiManzu"),
              fu: 0,
            },
            {
              tiles: pair(HaiKind.PinZu5),
              label: t("labelSuuhaiPinzu"),
              fu: 0,
            },
            { tiles: pair(HaiKind.Sha), label: t("labelOtakaze"), fu: 0 },
          ]}
        />
      </GuideSection>

      {/* コラム: 連風牌 */}
      <ChapterColumn namespace={namespace}>
        <PreferenceSettingsNote namespace={namespace} />
      </ChapterColumn>

      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={columns.formatFu}
        rows={[
          { label: t("rowSangen"), fu: 2 },
          { label: t("rowBakaze"), fu: 2 },
          { label: t("rowJikaze"), fu: 2 },
          { label: t("rowOther"), fu: 0 },
        ]}
      />
    </GuideBody>
  );
}

/** 面子の符計算 — 符セクション第 2 章（web の `MentsuFuGuide`） */
export function MentsuFuGuide() {
  const namespace = "mentsuFu.learn";
  const t = useTranslations(namespace);
  const columns = useExampleTableColumns(namespace);

  return (
    <GuideBody>
      <GuideSection title={t("whatIsMentsuFu")}>
        <GuideParagraph>{t("whatIsMentsuFuBody")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("shuntsuTitle")}>
        <GuideParagraph>{t("shuntsuBody")}</GuideParagraph>
        <ExampleTable
          title={t("shuntsuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleShuntsu([
                    HaiKind.ManZu2,
                    HaiKind.ManZu3,
                    HaiKind.ManZu4,
                  ])}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("shuntsuLabel"),
              fu: 0,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("koutsuTitle")}>
        <GuideParagraph>{t("koutsuBody")}</GuideParagraph>
        <ExampleTable
          title={t("koutsuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleMinkou(HaiKind.ManZu5)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuOpenSimpleLabel"),
              fu: 2,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleAnkou(HaiKind.PinZu3)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuClosedSimpleLabel"),
              fu: 4,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleMinkou(HaiKind.Haku)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuOpenYaochuLabel"),
              fu: 4,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleAnkou(HaiKind.ManZu1)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("koutsuClosedYaochuLabel"),
              fu: 8,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("kantsuTitle")}>
        <GuideParagraph>{t("kantsuBody")}</GuideParagraph>
        <ExampleTable
          title={t("kantsuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleMinkan(HaiKind.SouZu5)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuOpenSimpleLabel"),
              fu: 8,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleAnkan(HaiKind.PinZu7)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuClosedSimpleLabel"),
              fu: 16,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleMinkan(HaiKind.Chun)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuOpenYaochuLabel"),
              fu: 16,
            },
            {
              tiles: (
                <MentsuSet
                  mentsu={exampleAnkan(HaiKind.PinZu9)}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kantsuClosedYaochuLabel"),
              fu: 32,
            },
          ]}
        />
      </GuideSection>

      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={columns.formatFu}
        rows={[
          { label: t("rowShuntsu"), fu: 0 },
          { label: t("rowOpenSimpleKoutsu"), fu: 2 },
          { label: t("rowClosedSimpleKoutsuOrOpenYaochuKoutsu"), fu: 4 },
          { label: t("rowClosedYaochuKoutsuOrOpenSimpleKantsu"), fu: 8 },
          { label: t("rowClosedSimpleKantsuOrOpenYaochuKantsu"), fu: 16 },
          { label: t("rowClosedYaochuKantsu"), fu: 32 },
        ]}
      />
    </GuideBody>
  );
}

/** 待ちの符計算 — 符セクション第 3 章（web の `MachiFuGuide`） */
export function MachiFuGuide() {
  const namespace = "machiFu.learn";
  const t = useTranslations(namespace);
  // 待ちは手の内と和了牌を並べるため、牌の列だけ見出しを差し替える
  const columns = useExampleTableColumns(namespace, "colMachi");

  return (
    <GuideBody>
      <GuideSection title={t("whatIsMachi")}>
        <GuideParagraph>{t("whatIsMachiBody")}</GuideParagraph>
      </GuideSection>

      <GuideSection title={t("twoFuTitle")}>
        <GuideParagraph>{t("twoFuBody")}</GuideParagraph>
        <ExampleTable
          title={t("twoFuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.ManZu2, HaiKind.ManZu4]}
                  agariHai={HaiKind.ManZu3}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("kanchanLabel"),
              fu: 2,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.PinZu1, HaiKind.PinZu2]}
                  agariHai={HaiKind.PinZu3}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("penchanLabel"),
              fu: 2,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.Haku]}
                  agariHai={HaiKind.Haku}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("tankiLabel"),
              fu: 2,
            },
          ]}
        />
      </GuideSection>

      <GuideSection title={t("zeroFuTitle")}>
        <GuideParagraph>{t("zeroFuBody")}</GuideParagraph>
        <ExampleTable
          title={t("zeroFuExamples")}
          columns={columns}
          rows={[
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.SouZu6, HaiKind.SouZu7]}
                  agariHai={HaiKind.SouZu5}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("ryanmenLabel"),
              fu: 0,
            },
            {
              tiles: (
                <MachiTiles
                  tiles={[HaiKind.Ton, HaiKind.Ton, HaiKind.Haku, HaiKind.Haku]}
                  agariHai={HaiKind.Ton}
                  size={CELL_TILE_SIZE}
                />
              ),
              label: t("shanponLabel"),
              fu: 0,
            },
          ]}
        />
        <GuideNote>{t("nobetanNote")}</GuideNote>
      </GuideSection>

      <FuSummaryTable
        title={t("summaryTitle")}
        colType={t("colType")}
        colFu={t("colFu")}
        formatFu={columns.formatFu}
        rows={[
          { label: t("rowKanchan"), fu: 2 },
          { label: t("rowPenchan"), fu: 2 },
          { label: t("rowTanki"), fu: 2 },
          { label: t("rowRyanmen"), fu: 0 },
          { label: t("rowShanpon"), fu: 0 },
        ]}
      />
    </GuideBody>
  );
}
