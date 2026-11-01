/**
 * 面子・雀頭符のヘルプ本文の節（`mentsuJantouFu.help.<節>.{title,body}` の接頭辞）
 * 面子・雀頭符ヘルプの節
 *
 * web とアプリが同じ辞書を同じ順で読む。片方だけに節を足すと、もう片方に
 * 本文の欠けたヘルプが出るため、並びをここに 1 つだけ持つ。
 */
export const MENTSU_JANTOU_FU_HELP_SECTIONS = [
  "ronKoutsu",
  "jantou",
  "shuntsu",
  "scope",
] as const;
