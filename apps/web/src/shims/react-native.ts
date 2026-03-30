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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTransformArray(
  value: unknown,
): value is readonly Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

function convertTransform(
  transforms: readonly Record<string, unknown>[],
): string {
  return transforms
    .map((t) => {
      if ("rotate" in t) return `rotate(${t.rotate})`;
      if ("translateY" in t) return `translateY(${t.translateY}px)`;
      if ("translateX" in t) return `translateX(${t.translateX}px)`;
      if ("scale" in t) return `scale(${t.scale})`;
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

function normalizeStyle(
  style: unknown
): Record<string, unknown> | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    return normalizeStyle(Object.assign({}, ...style.filter(Boolean)));
  }
  if (isRecord(style)) {
    if (isTransformArray(style.transform)) {
      return { ...style, transform: convertTransform(style.transform) };
    }
    return style;
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

// RN Image receives `source` (object with `uri` or a require() result).
// HTML <img> needs `src` (string).
function resolveSource(source: unknown): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") return source;
  if (isRecord(source) && "uri" in source && typeof source.uri === "string") {
    return source.uri;
  }
  return undefined;
}

export const Image = forwardRef<HTMLImageElement, Record<string, unknown>>(
  function ImageShim(props, ref) {
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (RN_ONLY_PROPS.has(key)) continue;
      if (key === "source") {
        filtered["src"] = resolveSource(props[key]);
      } else if (key === "style") {
        filtered[key] = normalizeStyle(props[key]);
      } else {
        filtered[key] = props[key];
      }
    }
    return createElement("img", { ...filtered, ref });
  }
);
