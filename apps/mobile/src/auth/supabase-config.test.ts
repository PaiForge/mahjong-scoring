import { describe, expect, it } from "vitest";

import { resolveSupabaseConfig } from "./supabase-config";

describe("resolveSupabaseConfig", () => {
  it("環境変数が両方あればそれを使う", () => {
    expect(
      resolveSupabaseConfig({
        envUrl: "https://example.supabase.co",
        envKey: "sb_publishable_prod",
        isDev: false,
        hostUri: undefined,
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_prod",
    });
  });

  it("開発中は Metro のホストの手元の Supabase を読む（実機から Mac へ届く）", () => {
    expect(
      resolveSupabaseConfig({
        envUrl: undefined,
        envKey: undefined,
        isDev: true,
        hostUri: "192.168.1.10:8081",
      }),
    ).toMatchObject({ url: "http://192.168.1.10:54321" });
  });

  it("開発中で hostUri が無ければ localhost（Expo の web 版）", () => {
    expect(
      resolveSupabaseConfig({
        envUrl: undefined,
        envKey: undefined,
        isDev: true,
        hostUri: undefined,
      }),
    ).toMatchObject({ url: "http://localhost:54321" });
  });

  it("ストアのビルドで環境変数が欠けていればログインを出さない（undefined）", () => {
    expect(
      resolveSupabaseConfig({
        envUrl: "https://example.supabase.co",
        envKey: undefined,
        isDev: false,
        hostUri: undefined,
      }),
    ).toBeUndefined();
  });
});
