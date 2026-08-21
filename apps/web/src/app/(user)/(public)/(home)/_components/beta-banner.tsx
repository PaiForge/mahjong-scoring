import { useTranslations } from "next-intl";

export function BetaBanner() {
  const t = useTranslations("landing");

  return (
    <div className="border-b-4 border-ink bg-warning-subtle px-4 py-2 text-center text-sm font-bold text-warning-strong">
      {t("betaBanner")}
    </div>
  );
}
