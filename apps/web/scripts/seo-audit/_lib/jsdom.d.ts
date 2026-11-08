/**
 * jsdom の型（監査が使う範囲だけ）
 *
 * jsdom は vitest の DOM 環境として devDependency に入っているが、型定義
 * （`@types/jsdom`）は入っていない。監査は HTML・XML を解析するだけなので、
 * 依存を足さずに使う部分の宣言だけをここに置く。`@types/jsdom` を入れたら
 * このファイルを消す。
 */
declare module "jsdom" {
  export interface ConstructorOptions {
    /** `application/xml` を渡すと名前空間を扱う XML として解析する */
    readonly contentType?: string;
  }

  export class JSDOM {
    constructor(html?: string, options?: ConstructorOptions);
    readonly window: Window & typeof globalThis;
  }
}
