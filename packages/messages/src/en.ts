import metadata from "./en/metadata.json";
import nav from "./en/nav.json";
import reference from "./en/reference.json";
import scoreTable from "./en/score-table.json";
import footer from "./en/footer.json";
import common from "./en/common.json";
import notifications from "./en/notifications.json";
import notFound from "./en/not-found.json";
import errorPage from "./en/error-page.json";
import glossary from "./en/glossary.json";
import learnCurriculum from "./en/learn-curriculum.json";
import landing from "./en/landing.json";
import company from "./en/company.json";
import ranks from "./en/ranks.json";
import nativeAd from "./en/native-ad.json";
import yakuNames from "./en/yaku-names.json";
import manganKoRon from "./en/mangan-ko-ron.json";
import manganOyaRon from "./en/mangan-oya-ron.json";
import manganKoTsumo from "./en/mangan-ko-tsumo.json";
import manganOyaTsumo from "./en/mangan-oya-tsumo.json";
import manganScoreTable from "./en/mangan-score-table.json";
import yaku from "./en/yaku.json";
import whyScoringIsHardToLearn from "./en/why-scoring-is-hard-to-learn.json";
import whyScoringIsComplex from "./en/why-scoring-is-complex.json";
import jantouFu from "./en/jantou-fu.json";
import mentsuFu from "./en/mentsu-fu.json";
import machiFu from "./en/machi-fu.json";
import tehaiFu from "./en/tehai-fu.json";
import chiitoitsuScore from "./en/chiitoitsu-score.json";
import pinfuScore from "./en/pinfu-score.json";
import menzenMentsuScore from "./en/menzen-mentsu-score.json";
import furoScore from "./en/furo-score.json";
import fuDoubling from "./en/fu-doubling.json";
import tsumoPayments from "./en/tsumo-payments.json";
import ronToTsumo from "./en/ron-to-tsumo.json";
import oyaRonScores from "./en/oya-ron-scores.json";
import practice from "./en/practice.json";
import challenge from "./en/challenge.json";
import training from "./en/training.json";
import examTraining from "./en/exam-training.json";
import examResult from "./en/exam-result.json";
import exp from "./en/exp.json";
import practiceQuota from "./en/practice-quota.json";
import dojo from "./en/dojo.json";
import aboutThisApp from "./en/about-this-app.json";
import gettingStarted from "./en/getting-started.json";
import tryDemo from "./en/try-demo.json";
import agariScore from "./en/agari-score.json";
import tenpaiScore from "./en/tenpai-score.json";
import settings from "./en/settings.json";
import mentsuJantouFu from "./en/mentsu-jantou-fu.json";
import totalFu from "./en/total-fu.json";
import scoreTableChallenge from "./en/score-table-challenge.json";
import scoreCalculationChallenge from "./en/score-calculation-challenge.json";
import manganScoreCalculationChallenge from "./en/mangan-score-calculation-challenge.json";
import hanCountChallenge from "./en/han-count-challenge.json";
import yakuHanChallenge from "./en/yaku-han-challenge.json";
import fuExamChallenge from "./en/fu-exam-challenge.json";
import fuScoreExamChallenge from "./en/fu-score-exam-challenge.json";
import scoreExamChallenge from "./en/score-exam-challenge.json";
import pinfuExamChallenge from "./en/pinfu-exam-challenge.json";
import chiitoitsuExamChallenge from "./en/chiitoitsu-exam-challenge.json";
import manganExamChallenge from "./en/mangan-exam-challenge.json";
import lessons from "./en/lessons.json";
import tryMentsuFu from "./en/try-mentsu-fu.json";
import auth from "./en/auth.json";
import signUp from "./en/sign-up.json";
import verifyEmail from "./en/verify-email.json";
import forgotPassword from "./en/forgot-password.json";
import resetPassword from "./en/reset-password.json";
import validation from "./en/validation.json";
import setupUsername from "./en/setup-username.json";
import banned from "./en/banned.json";
import dashboard from "./en/dashboard.json";
import announcements from "./en/announcements.json";
import mypage from "./en/mypage.json";
import mypageAccount from "./en/mypage-account.json";
import deleteAccount from "./en/delete-account.json";
import mypagePlan from "./en/mypage-plan.json";
import profileEdit from "./en/profile-edit.json";
import pagination from "./en/pagination.json";
import terms from "./en/terms.json";
import privacy from "./en/privacy.json";
import legal from "./en/legal.json";
import contact from "./en/contact.json";
import plan from "./en/plan.json";
import tokushoho from "./en/tokushoho.json";
import recordCta from "./en/record-cta.json";
import leaderboard from "./en/leaderboard.json";
import mobilePlan from "./en/mobile-plan.json";
import mobileApp from "./en/mobile-app.json";
import type {
  EnTranslatedNamespace,
  MessagesShape,
} from "./translation-status";

/**
 * 英語の辞書（完訳した名前空間だけ）
 * 英語辞書
 *
 * `ja.ts` と同じ命名・束ね方（名前空間ごとに `en/<名前空間のケバブケース>.json` を
 * 1 つ置き、ここで束ねる）。web とモバイルで辞書を分けない。辞書キーはレジストリと
 * 結び付いた契約（`reference.<key>.{title,description}`・`scoreTable.<HIGH_SCORES の nameKey>`・
 * `nav.<labelKey>` 等）なので、キーは日本語と同じ文字列を使う。
 *
 * 束ねるのは `translation-status.ts` の完訳の名前空間だけで、未着手の名前空間は
 * 持たない。読む側は言語ごとにこの束か `ja.ts` の束の一方だけを使い、日本語へ
 * fallback しない。完訳の名前空間の形は日本語と同じでなければならず、型
 * （`MessagesShape` を満たすこと）と `en.test.ts`（余分なキー・ICU の引数・
 * 日本語の残り）が検査する。
 *
 * 名前空間を訳し終えたら、ファイルを置き、ここに import と 1 行を足し、
 * `translation-status.ts` で未着手から完訳へ移す。
 */
export const messages = {
  metadata,
  nav,
  reference,
  scoreTable,
  footer,
  common,
  notifications,
  notFound,
  errorPage,
  glossary,
  learnCurriculum,
  landing,
  company,
  ranks,
  nativeAd,
  yakuNames,
  manganKoRon,
  manganOyaRon,
  manganKoTsumo,
  manganOyaTsumo,
  manganScoreTable,
  yaku,
  whyScoringIsHardToLearn,
  whyScoringIsComplex,
  jantouFu,
  mentsuFu,
  machiFu,
  tehaiFu,
  chiitoitsuScore,
  pinfuScore,
  menzenMentsuScore,
  furoScore,
  fuDoubling,
  tsumoPayments,
  ronToTsumo,
  oyaRonScores,
  practice,
  challenge,
  training,
  examTraining,
  examResult,
  exp,
  practiceQuota,
  dojo,
  aboutThisApp,
  gettingStarted,
  tryDemo,
  agariScore,
  tenpaiScore,
  settings,
  mentsuJantouFu,
  totalFu,
  scoreTableChallenge,
  scoreCalculationChallenge,
  manganScoreCalculationChallenge,
  hanCountChallenge,
  yakuHanChallenge,
  fuExamChallenge,
  fuScoreExamChallenge,
  scoreExamChallenge,
  pinfuExamChallenge,
  chiitoitsuExamChallenge,
  manganExamChallenge,
  lessons,
  tryMentsuFu,
  auth,
  signUp,
  verifyEmail,
  forgotPassword,
  resetPassword,
  validation,
  setupUsername,
  banned,
  dashboard,
  announcements,
  mypage,
  mypageAccount,
  deleteAccount,
  mypagePlan,
  profileEdit,
  pagination,
  terms,
  privacy,
  legal,
  contact,
  plan,
  tokushoho,
  recordCta,
  leaderboard,
  mobilePlan,
  mobileApp,
} satisfies Pick<MessagesShape, EnTranslatedNamespace>;

/** 英語の辞書の型（完訳の名前空間 → 文言の木） */
export type Messages = typeof messages;
