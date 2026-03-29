// Shim for react-native imports used by @pai-forge/mahjong-react-ui on web.
// Stubs RN components to their DOM equivalents, filtering out RN-specific props.

import { forwardRef, createElement } from "react";

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
};

const RN_ONLY_PROPS = new Set([
  "resizeMode",
  "fadeDuration",
  "progressiveRenderingEnabled",
]);

const PRESSABLE_PROP_MAP: Record<string, string | null> = {
  onPress: "onClick",
  onPressIn: "onMouseDown",
  onPressOut: "onMouseUp",
  onLongPress: null,
  accessibilityRole: "role",
  accessibilityLabel: "aria-label",
  accessibilityHint: null,
  accessibilityState: null,
};

function normalizeStyle(
  style: unknown
): Record<string, unknown> | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean));
  }
  if (typeof style === "object") {
    return style as Record<string, unknown>;
  }
  return undefined;
}

export const Pressable = forwardRef<HTMLDivElement, Record<string, unknown>>(
  function PressableShim(props, ref) {
    const mapped: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (key === "style") {
        mapped[key] = normalizeStyle(props[key]);
      } else if (key in PRESSABLE_PROP_MAP) {
        const webKey = PRESSABLE_PROP_MAP[key];
        if (webKey) mapped[webKey] = props[key];
      } else {
        mapped[key] = props[key];
      }
    }
    return createElement("div", { ...mapped, ref });
  }
);

export const Image = forwardRef<HTMLImageElement, Record<string, unknown>>(
  function ImageShim(props, ref) {
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (RN_ONLY_PROPS.has(key)) continue;
      if (key === "style") {
        filtered[key] = normalizeStyle(props[key]);
      } else {
        filtered[key] = props[key];
      }
    }
    return createElement("img", { ...filtered, ref });
  }
);
