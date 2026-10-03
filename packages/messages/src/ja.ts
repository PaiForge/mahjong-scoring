import metadata from "./ja/metadata.json";
import nav from "./ja/nav.json";
import settings from "./ja/settings.json";
import deleteAccount from "./ja/delete-account.json";
import announcements from "./ja/announcements.json";
import landing from "./ja/landing.json";
import gettingStarted from "./ja/getting-started.json";
import tryDemo from "./ja/try-demo.json";
import dashboard from "./ja/dashboard.json";
import practice from "./ja/practice.json";
import challenge from "./ja/challenge.json";
import examResult from "./ja/exam-result.json";
import training from "./ja/training.json";
import examTraining from "./ja/exam-training.json";
import exp from "./ja/exp.json";
import manganKoRon from "./ja/mangan-ko-ron.json";
import manganScoreTable from "./ja/mangan-score-table.json";
import manganOyaRon from "./ja/mangan-oya-ron.json";
import manganKoTsumo from "./ja/mangan-ko-tsumo.json";
import manganOyaTsumo from "./ja/mangan-oya-tsumo.json";
import jantouFu from "./ja/jantou-fu.json";
import machiFu from "./ja/machi-fu.json";
import mentsuFu from "./ja/mentsu-fu.json";
import mentsuJantouFu from "./ja/mentsu-jantou-fu.json";
import tehaiFu from "./ja/tehai-fu.json";
import pinfuScore from "./ja/pinfu-score.json";
import chiitoitsuScore from "./ja/chiitoitsu-score.json";
import menzenMentsuScore from "./ja/menzen-mentsu-score.json";
import furoScore from "./ja/furo-score.json";
import fuDoubling from "./ja/fu-doubling.json";
import tsumoPayments from "./ja/tsumo-payments.json";
import ronToTsumo from "./ja/ron-to-tsumo.json";
import totalFu from "./ja/total-fu.json";
import yaku from "./ja/yaku.json";
import reference from "./ja/reference.json";
import glossary from "./ja/glossary.json";
import scoreTable from "./ja/score-table.json";
import machiScore from "./ja/machi-score.json";
import score from "./ja/score.json";
import aboutThisApp from "./ja/about-this-app.json";
import whyScoringIsComplex from "./ja/why-scoring-is-complex.json";
import learnCurriculum from "./ja/learn-curriculum.json";
import footer from "./ja/footer.json";
import terms from "./ja/terms.json";
import privacy from "./ja/privacy.json";
import legal from "./ja/legal.json";
import company from "./ja/company.json";
import contact from "./ja/contact.json";
import auth from "./ja/auth.json";
import signUp from "./ja/sign-up.json";
import verifyEmail from "./ja/verify-email.json";
import forgotPassword from "./ja/forgot-password.json";
import resetPassword from "./ja/reset-password.json";
import validation from "./ja/validation.json";
import mypage from "./ja/mypage.json";
import setupUsername from "./ja/setup-username.json";
import profileEdit from "./ja/profile-edit.json";
import publicProfile from "./ja/public-profile.json";
import admin from "./ja/admin.json";
import banned from "./ja/banned.json";
import pagination from "./ja/pagination.json";
import leaderboard from "./ja/leaderboard.json";
import common from "./ja/common.json";
import scoreTableChallenge from "./ja/score-table-challenge.json";
import scoreCalculationChallenge from "./ja/score-calculation-challenge.json";
import dojo from "./ja/dojo.json";
import ranks from "./ja/ranks.json";
import fuExamChallenge from "./ja/fu-exam-challenge.json";
import fuScoreExamChallenge from "./ja/fu-score-exam-challenge.json";
import scoreExamChallenge from "./ja/score-exam-challenge.json";
import pinfuExamChallenge from "./ja/pinfu-exam-challenge.json";
import chiitoitsuExamChallenge from "./ja/chiitoitsu-exam-challenge.json";
import manganExamChallenge from "./ja/mangan-exam-challenge.json";
import manganScoreCalculationChallenge from "./ja/mangan-score-calculation-challenge.json";
import hanCountChallenge from "./ja/han-count-challenge.json";
import yakuHanChallenge from "./ja/yaku-han-challenge.json";
import nativeAd from "./ja/native-ad.json";
import practiceQuota from "./ja/practice-quota.json";
import plan from "./ja/plan.json";
import mypagePlan from "./ja/mypage-plan.json";
import tokushoho from "./ja/tokushoho.json";
import notifications from "./ja/notifications.json";

/**
 * 日本語の辞書（全名前空間）
 * 日本語辞書
 *
 * 名前空間ごとに 1 ファイル（`<名前空間のケバブケース>.json`）に分け、ここで
 * 1 つに束ねる。キーの並びは名前空間の追加順。web（next-intl）はこれを
 * そのまま渡す。モバイル（use-intl）は使う名前空間だけを分割代入で取り出して
 * 束ね直す（`const { practice, challenge } = messages`）— 型が保たれたまま、
 * web 専用の本文（教本・規約・管理画面）を載せずに済む。
 *
 * 名前空間を足すときはファイルを置き、ここに import と 1 行を足す。
 * ファイルと束ねた一覧の食い違いは `ja.test.ts` が落とす。
 */
export const messages = {
  metadata,
  nav,
  settings,
  deleteAccount,
  announcements,
  landing,
  gettingStarted,
  tryDemo,
  dashboard,
  practice,
  challenge,
  examResult,
  training,
  examTraining,
  exp,
  manganKoRon,
  manganScoreTable,
  manganOyaRon,
  manganKoTsumo,
  manganOyaTsumo,
  jantouFu,
  machiFu,
  mentsuFu,
  mentsuJantouFu,
  tehaiFu,
  pinfuScore,
  chiitoitsuScore,
  menzenMentsuScore,
  furoScore,
  fuDoubling,
  tsumoPayments,
  ronToTsumo,
  totalFu,
  yaku,
  reference,
  glossary,
  scoreTable,
  machiScore,
  score,
  aboutThisApp,
  whyScoringIsComplex,
  learnCurriculum,
  footer,
  terms,
  privacy,
  legal,
  company,
  contact,
  auth,
  signUp,
  verifyEmail,
  forgotPassword,
  resetPassword,
  validation,
  mypage,
  setupUsername,
  profileEdit,
  publicProfile,
  admin,
  banned,
  pagination,
  leaderboard,
  common,
  scoreTableChallenge,
  scoreCalculationChallenge,
  dojo,
  ranks,
  fuExamChallenge,
  fuScoreExamChallenge,
  scoreExamChallenge,
  pinfuExamChallenge,
  chiitoitsuExamChallenge,
  manganExamChallenge,
  manganScoreCalculationChallenge,
  hanCountChallenge,
  yakuHanChallenge,
  nativeAd,
  practiceQuota,
  plan,
  mypagePlan,
  tokushoho,
  notifications,
};

/** 辞書の型（名前空間 → 文言の木） */
export type Messages = typeof messages;
