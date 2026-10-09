/* eslint-disable @typescript-eslint/no-require-imports */
// 問題の生成が使う crypto.randomUUID を、ルーターが画面を読むより先に生やす
require("./src/lib/install-random-uuid");
require("expo-router/entry");
