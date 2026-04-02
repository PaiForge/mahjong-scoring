import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageTitle } from "@/app/_components/page-title";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin");

  return (
    <div>
      <PageTitle className="mb-6">{t("dashboard")}</PageTitle>
      <p className="text-gray-600 mb-8">{t("dashboardDescription")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="block rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold mb-2">
            {t("userManagement")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("userManagementDescription")}
          </p>
        </Link>
      </div>
    </div>
  );
}
