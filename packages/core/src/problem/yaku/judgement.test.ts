import { describe, it, expect } from "vitest";
import { judgeYakuAnswer } from "./judgement";

describe("judgeYakuAnswer", () => {
  it("完全一致で true を返す", () => {
    expect(judgeYakuAnswer(["断么九", "平和"], ["平和", "断么九"])).toBe(true);
  });

  it("空配列同士で true を返す", () => {
    expect(judgeYakuAnswer([], [])).toBe(true);
  });

  it("単一の役で一致する場合 true を返す", () => {
    expect(judgeYakuAnswer(["立直"], ["立直"])).toBe(true);
  });

  it("不足している役がある場合 false を返す", () => {
    expect(judgeYakuAnswer(["断么九", "平和"], ["断么九"])).toBe(false);
  });

  it("余分な役がある場合 false を返す", () => {
    expect(judgeYakuAnswer(["断么九"], ["断么九", "平和"])).toBe(false);
  });

  it("異なる役の場合 false を返す", () => {
    expect(judgeYakuAnswer(["断么九"], ["平和"])).toBe(false);
  });

  it("正解が空でユーザーが役を選択した場合 false を返す", () => {
    expect(judgeYakuAnswer([], ["断么九"])).toBe(false);
  });

  it("正解に役がありユーザーが空の場合 false を返す", () => {
    expect(judgeYakuAnswer(["断么九"], [])).toBe(false);
  });

  it("重複を含むユーザー入力でもセットとして比較する", () => {
    // ユーザーが同じ役を2回選択した場合（UIで防止すべきだが念のため）
    // Set化すると1つになるのでサイズ不一致で false
    expect(judgeYakuAnswer(["断么九"], ["断么九", "断么九"])).toBe(false);
  });

  it("多数の役で完全一致する場合 true を返す", () => {
    const many = [
      "立直",
      "門前清自摸和",
      "断么九",
      "平和",
      "一盃口",
      "役牌 白",
      "混一色",
    ];
    // 同じ要素・異なる順序
    const shuffled = [...many].reverse();
    expect(judgeYakuAnswer(many, shuffled)).toBe(true);
  });

  it("多数の役で1つ異なる場合 false を返す", () => {
    const correct = ["立直", "断么九", "平和", "一盃口"];
    const wrong = ["立直", "断么九", "平和", "七対子"];
    expect(judgeYakuAnswer(correct, wrong)).toBe(false);
  });

  it("単一の役で不一致の場合 false を返す", () => {
    expect(judgeYakuAnswer(["立直"], ["断么九"])).toBe(false);
  });
});
