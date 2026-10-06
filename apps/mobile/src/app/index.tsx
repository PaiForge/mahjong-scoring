import { Redirect } from "expo-router";

/** 起動時の画面は練習一覧 */
export default function Index() {
  return <Redirect href="/practice" />;
}
