import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FU_VALUES } from "@mahjong-scoring/core";
import { PROBLEM_VALUE_CATEGORIES } from "@mahjong-scoring/features/problem-facets/categories";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { HashAnchorScroll } from "@/app/_components/hash-anchor-scroll";
import { adminButtonClasses } from "@/app/admin/_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "@/app/admin/_lib/input-classes";
import {
  SEARCH_CATEGORY_GROUPS,
  SEARCH_SCALAR_FIELDS,
  SEARCH_ARRAY_FIELDS,
  type ProblemSearchFields,
  type ProblemSearchState,
} from "../_lib/search";

/** 単一選択の表示順。空文字の指定なしは共通で先頭に出す。 */
const SELECT_OPTIONS = {
  kind: ["agari-score", "tenpai-score"],
  agari: ["tsumo", "ron"],
  menzen: ["true", "false"],
  yakuMode: ["any", "all"],
} as const;

/**
 * 保存問題の検索フォーム
 * 問題検索フォーム
 *
 * GET で条件を URL に残す。チェックごとに検索せず送信時だけ検索し、条件を変えたら
 * page を送らず先頭ページへ戻す。無効な URL の入力も残して、その場で修正できる。
 */
export async function ProblemSearchForm({
  state,
}: {
  readonly state: ProblemSearchState;
}) {
  const t = await getTranslations("admin.problemCategories");
  const { fields, errors } = state;
  const invalid = (field: string) =>
    errors.some((error) => error.field === field);
  const fuSelect = (name: "fuMin" | "fuMax") => (
    <label className="flex flex-col gap-1" key={name}>
      {/* 例: admin.problemCategories.search.fields.fuMin */}
      <span>{t(`search.fields.${name}`)}</span>
      <select
        name={name}
        defaultValue={fields[name]}
        className={ADMIN_INPUT_CLASSES}
        aria-invalid={invalid(name)}
      >
        <option value="">{t("search.unspecified")}</option>
        {FU_VALUES.map((fu) => (
          <option key={fu} value={fu}>
            {t("search.fuValue", { fu })}
          </option>
        ))}
      </select>
    </label>
  );
  const singleSelect = (name: keyof typeof SELECT_OPTIONS) => (
    <label className="flex flex-col gap-1" key={name}>
      {/* 例: admin.problemCategories.search.fields.agari */}
      <span>{t(`search.fields.${name}`)}</span>
      <select
        name={name}
        defaultValue={fields[name] || (name === "yakuMode" ? "any" : "")}
        className={ADMIN_INPUT_CLASSES}
        aria-invalid={invalid(name)}
      >
        {name !== "yakuMode" && (
          <option value="">{t("search.unspecified")}</option>
        )}
        {SELECT_OPTIONS[name].map((value) => (
          // 例: admin.problemCategories.search.options.agari.tsumo
          <option key={value} value={value}>
            {t(`search.options.${name}.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      method="get"
      action="/admin/problem-categories#problems"
      className="admin-panel space-y-5 p-4 text-sm"
      key={JSON.stringify(fields)}
    >
      <input type="hidden" name="search" value="1" />
      <p className="text-surface-600">{t("search.note")}</p>
      {errors.length > 0 && (
        <div id="problems" role="alert" className="scroll-mt-4 text-red-700">
          <HashAnchorScroll />
          <p className="font-semibold">{t("search.invalid")}</p>
          <ul className="list-inside list-disc">
            {errors.map((error, index) => (
              <li key={`${error.field}-${String(index)}`}>
                {/* 例: admin.problemCategories.search.fields.fuMin / admin.problemCategories.search.errors.range */}
                {t(`search.fields.${error.field}`)}:{" "}
                {t(`search.errors.${error.message}`)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {singleSelect("kind")}
        {singleSelect("agari")}
        {singleSelect("menzen")}
      </div>
      <fieldset className="space-y-3">
        <legend className="font-semibold">{t("groups.fu")}</legend>
        <p className="text-surface-600">{t("search.fuNote")}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {FU_VALUES.map((fu) => (
            <label key={fu} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="fu"
                value={fu}
                defaultChecked={fields.fu.includes(String(fu))}
                aria-invalid={invalid("fu")}
              />
              {t("search.fuValue", { fu })}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fuSelect("fuMin")}
          {fuSelect("fuMax")}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-semibold">{t("search.han")}</legend>
        <p className="text-surface-600">{t("search.hanNote")}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["hanEq", "hanMin", "hanMax"] as const).map((name) => (
            <label className="flex flex-col gap-1" key={name}>
              {/* 例: admin.problemCategories.search.fields.hanEq */}
              <span>{t(`search.fields.${name}`)}</span>
              <input
                name={name}
                type="number"
                min={1}
                max={2147483647}
                step={1}
                defaultValue={fields[name]}
                className={ADMIN_INPUT_CLASSES}
                aria-invalid={invalid(name)}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {SEARCH_CATEGORY_GROUPS.map((group) => (
        <fieldset key={group} className="space-y-3">
          {/* 例: admin.problemCategories.groups.yaku */}
          <legend className="font-semibold">{t(`groups.${group}`)}</legend>
          {group === "yaku" && singleSelect("yakuMode")}
          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEM_VALUE_CATEGORIES.filter(
              (category) => category.group === group,
            ).map(({ id }) => (
              <label key={id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name={group}
                  value={id}
                  defaultChecked={fields[group].includes(id)}
                  className="mt-1"
                  aria-invalid={invalid(group)}
                />
                {/* 例: admin.problemCategories.categories.yaku-honitsu */}
                <span>{t(`categories.${id}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={adminButtonClasses()}>
          {t("search.submit")}
        </button>
        <Link href="/admin/problem-categories" className={TEXT_LINK_CLASSES}>
          {t("search.clear")}
        </Link>
      </div>
    </form>
  );
}

/** 検証済みの検索条件を結果に併記する。入力中のフォームではなく実行した条件を示す。 */
export async function ProblemSearchSummary({
  fields,
}: {
  readonly fields: ProblemSearchFields;
}) {
  const t = await getTranslations("admin.problemCategories");
  const entries = [...SEARCH_SCALAR_FIELDS, ...SEARCH_ARRAY_FIELDS].flatMap(
    (field) => {
      if (field === "yakuMode" && fields.yaku.length === 0) return [];
      const raw =
        field === "yakuMode" ? fields.yakuMode || "any" : fields[field];
      const values =
        typeof raw === "string" ? (raw ? [raw] : []) : [...new Set(raw)];
      if (!values.length) return [];
      const labelOf = (value: string) => {
        if (field === "yaku" || field === "machi" || field === "level") {
          // 例: admin.problemCategories.categories.machi-tanki
          return t(`categories.${value}`);
        }
        if (
          field === "kind" ||
          field === "agari" ||
          field === "menzen" ||
          field === "yakuMode"
        ) {
          // 例: admin.problemCategories.search.options.yakuMode.all
          return t(`search.options.${field}.${value}`);
        }
        return value;
      };
      return [{ field, value: values.map(labelOf).join(" / ") }];
    },
  );
  return entries.length === 0 ? (
    <p className="mb-4 text-sm">{t("search.all")}</p>
  ) : (
    <dl className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {entries.map(({ field, value }) => (
        <div key={field}>
          {/* 例: admin.problemCategories.search.fields.fuMin */}
          <dt className="font-semibold">{t(`search.fields.${field}`)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
