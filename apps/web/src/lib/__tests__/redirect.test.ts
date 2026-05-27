import { describe, expect, it } from "vitest";

import { sanitizeInternalRedirect } from "../redirect";

describe("sanitizeInternalRedirect", () => {
  describe("valid internal paths", () => {
    it("accepts a simple internal path", () => {
      expect(sanitizeInternalRedirect("/learn/jantou-fu")).toBe(
        "/learn/jantou-fu",
      );
    });

    it("accepts /mypage", () => {
      expect(sanitizeInternalRedirect("/mypage")).toBe("/mypage");
    });

    it("accepts root path", () => {
      expect(sanitizeInternalRedirect("/")).toBe("/");
    });

    it("accepts paths with query strings", () => {
      expect(sanitizeInternalRedirect("/practice?mode=timed")).toBe(
        "/practice?mode=timed",
      );
    });

    it("accepts paths with fragments", () => {
      expect(sanitizeInternalRedirect("/docs#section")).toBe("/docs#section");
    });
  });

  describe("invalid: protocol-relative URLs", () => {
    it("rejects //evil.com", () => {
      expect(sanitizeInternalRedirect("//evil.com")).toBeUndefined();
    });

    it("rejects //evil.com/path", () => {
      expect(sanitizeInternalRedirect("//evil.com/path")).toBeUndefined();
    });
  });

  describe("invalid: absolute URLs", () => {
    it("rejects https://evil.com", () => {
      expect(sanitizeInternalRedirect("https://evil.com")).toBeUndefined();
    });

    it("rejects http://evil.com", () => {
      expect(sanitizeInternalRedirect("http://evil.com")).toBeUndefined();
    });

    it("rejects HTTPS://EVIL.COM (case-insensitive)", () => {
      expect(sanitizeInternalRedirect("HTTPS://EVIL.COM")).toBeUndefined();
    });
  });

  describe("invalid: non-path-like inputs", () => {
    it("rejects javascript: scheme", () => {
      expect(sanitizeInternalRedirect("javascript:alert(1)")).toBeUndefined();
    });

    it("rejects data: scheme", () => {
      expect(sanitizeInternalRedirect("data:text/html,xxx")).toBeUndefined();
    });

    it("rejects relative paths without leading slash", () => {
      expect(sanitizeInternalRedirect("mypage")).toBeUndefined();
    });

    it("rejects empty string", () => {
      expect(sanitizeInternalRedirect("")).toBeUndefined();
    });
  });

  describe("invalid: non-string inputs", () => {
    it("rejects undefined", () => {
      expect(sanitizeInternalRedirect(undefined)).toBeUndefined();
    });

    it("rejects null", () => {
      expect(sanitizeInternalRedirect(null)).toBeUndefined();
    });

    it("rejects numbers", () => {
      expect(sanitizeInternalRedirect(42)).toBeUndefined();
    });

    it("rejects arrays", () => {
      expect(sanitizeInternalRedirect(["/mypage"])).toBeUndefined();
    });

    it("rejects objects", () => {
      expect(sanitizeInternalRedirect({ path: "/mypage" })).toBeUndefined();
    });
  });

  describe("invalid: paths embedding absolute URLs", () => {
    it("rejects /path/http://evil.com as it embeds http:", () => {
      expect(
        sanitizeInternalRedirect("/path/http://evil.com"),
      ).toBeUndefined();
    });

    it("rejects /redirect?next=https://evil.com", () => {
      expect(
        sanitizeInternalRedirect("/redirect?next=https://evil.com"),
      ).toBeUndefined();
    });

    it("rejects HtTpS://evil.com (mixed case)", () => {
      expect(sanitizeInternalRedirect("HtTpS://evil.com")).toBeUndefined();
    });
  });

  describe("invalid: backslash-based open redirect bypass (H1)", () => {
    it("rejects /\\evil.com", () => {
      expect(sanitizeInternalRedirect("/\\evil.com")).toBeUndefined();
    });

    it("rejects /\\/evil.com", () => {
      expect(sanitizeInternalRedirect("/\\/evil.com")).toBeUndefined();
    });

    it("rejects /\\\\evil.com", () => {
      expect(sanitizeInternalRedirect("/\\\\evil.com")).toBeUndefined();
    });
  });

  describe("invalid: control characters and whitespace (M1)", () => {
    it("rejects leading tab + //evil.com", () => {
      expect(sanitizeInternalRedirect("/\t//evil.com")).toBeUndefined();
    });

    it("rejects leading newline + //evil.com", () => {
      expect(sanitizeInternalRedirect("/\n//evil.com")).toBeUndefined();
    });

    it("rejects CRLF injection attempt", () => {
      expect(
        sanitizeInternalRedirect("/\r\nSet-Cookie: x=1"),
      ).toBeUndefined();
    });

    it("rejects null byte embedded in path", () => {
      expect(sanitizeInternalRedirect("/safe\x00/evil.com")).toBeUndefined();
    });

    it("rejects leading space before the path", () => {
      expect(sanitizeInternalRedirect(" /mypage")).toBeUndefined();
    });
  });

  // Task 3(D): 追加エッジケース
  describe("edge cases: short inputs", () => {
    it("accepts single char path /a", () => {
      expect(sanitizeInternalRedirect("/a")).toBe("/a");
    });

    it("accepts root / (alone)", () => {
      expect(sanitizeInternalRedirect("/")).toBe("/");
    });

    it("rejects empty string", () => {
      expect(sanitizeInternalRedirect("")).toBeUndefined();
    });
  });

  describe("edge cases: non-ASCII paths", () => {
    /**
     * 日本語パスは現状サニタイザでは許可される。
     * Next.js のルーティング側で punycode / UTF-8 URL エンコードに
     * 正規化される想定で、本関数はプロトコル/制御文字のみを検証する。
     */
    it("accepts Japanese multi-byte path /日本語", () => {
      expect(sanitizeInternalRedirect("/日本語")).toBe("/日本語");
    });

    it("accepts already percent-encoded Japanese path", () => {
      expect(
        sanitizeInternalRedirect("/%E6%97%A5%E6%9C%AC%E8%AA%9E"),
      ).toBe("/%E6%97%A5%E6%9C%AC%E8%AA%9E");
    });
  });

  describe("edge cases: percent-encoded bypasses (documented limitation)", () => {
    /**
     * 本テストは**意図的に "許可される" ことを検証する**。
     *
     * 理由:
     * - `sanitizeInternalRedirect` は raw bytes の段階で検証する。
     * - `%5C` (バックスラッシュ) や `%2F` (スラッシュ) は、Next.js の
     *   ルーティング層 / WHATWG URL パーサでデコードされる可能性があるが、
     *   `new URL("/%5Cevil.com", origin)` のような呼び出しでは
     *   pathname がそのまま保持されるため、実質的に安全。
     * - ただし後段のコンポーネントが decode+再マージするケースでは
     *   バイパスとなる可能性があるため、本関数を通った後の取り扱いにも注意。
     *
     * @see SecurityEngineer レビュー結果
     */
    it("passes /%5Cevil.com (percent-encoded backslash, decoded downstream)", () => {
      // 現状の実装では通ってしまう。後段（Next.js router）のデコード処理に依存。
      expect(sanitizeInternalRedirect("/%5Cevil.com")).toBe("/%5Cevil.com");
    });

    it("passes /%2Fevil.com (percent-encoded slash, decoded downstream)", () => {
      expect(sanitizeInternalRedirect("/%2Fevil.com")).toBe("/%2Fevil.com");
    });

    it("rejects /%20/path when %20 appears after leading slash but the 2nd byte is % (allowed)", () => {
      // %20 がリテラルで通るが、これは外部誘導ではないので問題ない。
      expect(sanitizeInternalRedirect("/%20evil.com")).toBe("/%20evil.com");
    });
  });

  describe("edge cases: trailing and embedded control chars beyond the leading slot", () => {
    it("rejects trailing CR+LF", () => {
      expect(sanitizeInternalRedirect("/foo\r\n")).toBeUndefined();
    });

    it("rejects DEL (0x7F) anywhere in the path", () => {
      expect(sanitizeInternalRedirect("/foo\u007Fbar")).toBeUndefined();
    });

    it("rejects vertical tab / form feed embedded", () => {
      expect(sanitizeInternalRedirect("/foo\u000Bbar")).toBeUndefined();
      expect(sanitizeInternalRedirect("/foo\u000Cbar")).toBeUndefined();
    });
  });

  describe("edge cases: case variants of http/https embedded elsewhere", () => {
    it("rejects /foo?next=HtTp: (embedded http: regardless of case)", () => {
      expect(sanitizeInternalRedirect("/foo?next=HtTp:evil")).toBeUndefined();
    });

    it("rejects /foo#HTTPS: (fragment containing the absolute scheme)", () => {
      expect(sanitizeInternalRedirect("/foo#HTTPS:evil")).toBeUndefined();
    });
  });

  describe("edge cases: path after sanitize is reused safely", () => {
    it("result is strictly equal to input when accepted (no mutation)", () => {
      const input = "/learn/jantou-fu?from=practice";
      expect(sanitizeInternalRedirect(input)).toBe(input);
    });

    it("result never contains a protocol scheme when accepted", () => {
      const inputs = [
        "/learn/about-this-app",
        "/mypage",
        "/practice/jantou-fu?mode=timed#review",
      ];
      for (const input of inputs) {
        const out = sanitizeInternalRedirect(input);
        expect(out).toBe(input);
        expect(out!.toLowerCase()).not.toContain("http:");
        expect(out!.toLowerCase()).not.toContain("https:");
      }
    });
  });
});
