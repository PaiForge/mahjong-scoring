import { Redirect } from "expo-router";

/** 起動時の画面は先頭のタブの道場（次の目標の級を上に置く） */
export default function Index() {
  return <Redirect href="/dojo" />;
}
