import { getTranslations } from "next-intl/server";

import { AppDownloadPanel } from "@/app/(user)/_components/app-download/app-download-panel";
import { DevicePhoneIcon } from "@/app/(user)/_components/icons/device-phone-icon";

/**
 * トップの「iPhone アプリ」節
 * アプリの紹介
 *
 * 他の節（`LandingSection`）と同じ見出しの型に揃え、CTA ボタンの代わりに
 * App Store のバッジと QR コードを置く。緑のボタンは「押して始める面」の
 * 記号で、ストアへ出ていく導線には使わない。LP の最後（フッターの直前）に
 * 置き、web で何ができるかを読んだ後に出す。
 */
export async function AppSection() {
  const t = await getTranslations("landing");

  return (
    <section className="border-t border-panel bg-surface-50 px-6 py-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-200 text-surface-700">
          <DevicePhoneIcon className="size-8" />
        </div>
        <h2 className="text-3xl font-bold text-surface-900">{t("appTitle")}</h2>
        <p className="max-w-2xl text-base md:text-lg leading-relaxed text-surface-500">
          {t("appDescription")}
        </p>
        <div className="pt-4">
          <AppDownloadPanel size="lg" align="center" />
        </div>
      </div>
    </section>
  );
}
