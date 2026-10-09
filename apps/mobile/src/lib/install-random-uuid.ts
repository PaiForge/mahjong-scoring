/**
 * Hermes に `crypto.randomUUID` を生やす（副作用だけのモジュール）
 *
 * `index.js` がルーターより先に読む。理由は `random-uuid-polyfill.ts`。
 */
import { randomUUID } from "expo-crypto";

import { installRandomUUID } from "./random-uuid-polyfill";

installRandomUUID(globalThis, randomUUID);
