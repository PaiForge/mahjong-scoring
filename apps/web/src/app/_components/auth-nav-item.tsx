"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserIcon } from "./icons/user-icon";
import { useAuth } from "@/app/_contexts/auth-context";

interface AuthNavItemProps {
  readonly className?: string;
  readonly iconClassName?: string;
  readonly skeletonIconClassName?: string;
  readonly skeletonTextClassName?: string;
}

export function AuthNavItem({
  className,
  iconClassName,
  skeletonIconClassName,
  skeletonTextClassName,
}: AuthNavItemProps) {
  const t = useTranslations("nav");
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={className}>
        <div className={`rounded-full bg-surface-200 animate-pulse ${skeletonIconClassName ?? ""}`} />
        <div className={`rounded bg-surface-200 animate-pulse ${skeletonTextClassName ?? ""}`} />
      </div>
    );
  }

  const href = user ? "/mypage" : "/sign-in";
  const label = user ? t("mypage") : t("login");

  return (
    <Link href={href} className={className}>
      <UserIcon className={iconClassName} />
      {label}
    </Link>
  );
}
