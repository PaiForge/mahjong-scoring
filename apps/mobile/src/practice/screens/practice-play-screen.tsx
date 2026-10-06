import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

import type { PracticeScreens } from "../practice-screens";
import { useRouteVariant } from "./use-route-variant";

/** チャレンジの画面（URL のバリアントで盤面を開く） */
export function PracticePlayScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const variant = useRouteVariant(slug);
  const { Play } = screens;
  return <Play variant={variant} />;
}

/** トレーニングの画面（URL のバリアントで盤面を開く） */
export function PracticeTrainingScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const variant = useRouteVariant(slug);
  const { Training } = screens;
  return <Training variant={variant} />;
}
