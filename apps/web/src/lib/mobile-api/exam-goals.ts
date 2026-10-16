import "server-only";

import type { NextResponse } from "next/server";

import {
  examGoalsFromRegistry,
  type MobileExamGoalsResponse,
} from "@mahjong-scoring/features/exam/mobile-api";

import { mobileJson } from "./response";

/**
 * 昇級試験の合格ラインを返す（アプリ向け）
 * 試験合格ラインAPI（アプリ向け）
 *
 * 説明画面の合格条件を、開始後にサーバーが求める値（`finishedChallengeTime`・
 * 開始の応答の `goalCount`）と揃えるためのもの。誰が読んでも同じなので
 * ログインを要らない。
 */
export function handleReadExamGoals(): NextResponse {
  return mobileJson<MobileExamGoalsResponse>(examGoalsFromRegistry());
}
