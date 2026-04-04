import { useTranslations } from "next-intl";

export function BetaBanner() {
  const t = useTranslations("landing");

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm font-medium text-yellow-800">
      {t("betaBanner")}
    </div>
  );
}
