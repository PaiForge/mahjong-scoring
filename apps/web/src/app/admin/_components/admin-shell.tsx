"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/** この幅以上ではサイドバーを常設し、未満ではドロワーにする（admin.css の 1023px と対） */
const PERSISTENT_SIDEBAR_QUERY = "(min-width: 1024px)";

interface AdminShellProps {
  /** サイドバーの中身（ブランドとナビ）。サーバーで描いて渡す */
  readonly sidebar: ReactNode;
  /** 上端の帯の左側（メニューボタンの右に並ぶ） */
  readonly topbarStart: ReactNode;
  /** 上端の帯の右側 */
  readonly topbarEnd: ReactNode;
  readonly labels: {
    readonly openMenu: string;
    readonly closeMenu: string;
  };
  readonly children: ReactNode;
}

/**
 * 管理画面の枠（サイドバー・上端の帯・本文）
 * 管理シェル
 *
 * @design 1024px 未満ではサイドバーをドロワーにする
 * 幅 1024px 以上（iPad の横向き・PC）はサイドバーを常設する。未満（iPad の
 * 縦向き）は常設すると 216px が本文の 3 割近くを取り、ユーザー一覧の表が
 * 横スクロールになる（768px で本文 552px・表 714px を実測）。そこで上端の帯に
 * メニューボタンを出し、サイドバーは画面の外から開くドロワーにする。
 * 以前は「タブレットでも常設」に揃えていた（ナビを上に折り返す形をやめたとき）
 * が、ドロワーなら PC と同じ縦並びのナビをそのまま出せる。
 *
 * 開閉の状態だけをここで持ち、サイドバーの中身はサーバーで描いて受け取る
 * （辞書の解決をサーバーに置いたまま）。ドロワーは背景・Escape・閉じるボタン・
 * ナビのリンクを押すと閉じる。閉じている間は CSS が `visibility: hidden` にして、
 * 画面外のリンクへ Tab でフォーカスが入らないようにする。
 */
export function AdminShell({
  sidebar,
  topbarStart,
  topbarEnd,
  labels,
  children,
}: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    // 開いたまま横向きにして常設の幅になったら、ドロワーの状態（背景の
    // スクロール止め）を残さない
    const persistent = window.matchMedia(PERSISTENT_SIDEBAR_QUERY);
    const onWiden = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    persistent.addEventListener("change", onWiden);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      persistent.removeEventListener("change", onWiden);
      root.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          className="admin-drawer-backdrop"
          onClick={() => close(true)}
        />
      )}
      <aside
        id="admin-sidebar"
        className="admin-sidebar"
        data-open={open || undefined}
        // ナビのリンクで移動したら閉じる（同じページのリンクでも閉じる）
        onClick={(event) => {
          if (
            open &&
            event.target instanceof Element &&
            event.target.closest("a")
          ) {
            close(false);
          }
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label={labels.closeMenu}
          className="admin-drawer-close"
          onClick={() => close(true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {sidebar}
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span className="flex items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={labels.openMenu}
              aria-expanded={open}
              aria-controls="admin-sidebar"
              className="admin-menu-button"
              onClick={() => setOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            {topbarStart}
          </span>
          {topbarEnd}
        </header>
        {children}
      </div>
    </>
  );
}
