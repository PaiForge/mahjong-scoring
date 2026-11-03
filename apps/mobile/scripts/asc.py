# /// script
# requires-python = ">=3.10"
# dependencies = ["pyjwt[crypto]>=2.8"]
# ///
"""App Store Connect API で、審査に出すバージョンの準備を読み書きする。

    uv run scripts/asc.py audit [--version 1.0.0]
    uv run scripts/asc.py get    /v1/apps/<id>/appInfos
    uv run scripts/asc.py patch  /v1/appInfos/<id> '<JSON の本文>'
    uv run scripts/asc.py post   /v1/reviewSubmissions '<JSON の本文>'
    uv run scripts/asc.py delete /v1/<リソース>/<id>

`audit` は、準備中のバージョン（`--version` で渡したもの。省略時は App Store
Connect がまだ編集を許している 1 つ）の提出に要る項目を読み、1 項目 1 行で
`ok` / `MISSING` / `note` を出す。何も書かず、欠けがあれば 1 で終わる。
App Store Connect はほとんどの欠けを提出のときに 1 つずつ拒否として返すだけで、
見た目の既定値が無いもの（ビルドの無いバージョン・null の年齢制限・主カテゴリ
の未設定・コンテンツの権利の未回答・プライバシーポリシーの URL の無いロケール）は
API でしか「未設定」と分からない。項目は Parqsee（同じチームの Mac アプリ）の
1.0 の提出で要ったものに、このアプリのアプリ内課金の分を足したもの。

`audit` が見られないもの:

- App Privacy（プライバシーラベル）の回答は公開 API に無い。確かめられるのは、
  バージョンを下書きの `reviewSubmissions` に足すこと — App Store Connect は
  残りの欠けを `meta.associatedErrors` に並べて項目を拒否する（下書きは
  `submitted: true` を PATCH するまで送られず、項目は消せる）。項目が拒否されて
  空のまま残った下書きは `canceled: true` も受け付けない（"Resource is not in
  cancellable state"）。害は無く、Web の画面から提出するときにその下書きが使われる
- その種類で最初のアプリ内課金（消耗型・非消耗型のそれぞれ）は、App Store
  Connect の Web の画面（商品のページ → Add for Review）からしかバージョンの
  提出に加えられない。API の `inAppPurchaseSubmissions` は
  FIRST_NON_CONSUMABLE_MUST_BE_SUBMITTED_ON_VERSION で拒否し、
  `reviewSubmissionItems` には商品との関連が無い。加えた後は Web の画面の
  App Review のページで確かめる
- デモアカウントのパスワードは中身を出さない（入っているかどうかだけ）

`get` / `patch` / `post` / `delete` は素の呼び出しで、状態コードと JSON の
応答を出す。1 回きりの書き込み（価格・提出）は、本文をその場で書き、ここには
残さない。

環境変数（鍵は App Store Connect の Users and Access > Integrations で作る
チームの鍵。Parqsee と同じものを使える）:

    ASC_API_KEY_ID      鍵の Key ID
    ASC_API_ISSUER_ID   鍵の Issuer ID
    ASC_API_KEY_PATH    .p8 のパス。省略時は
                        ~/.appstoreconnect/private_keys/AuthKey_<ASC_API_KEY_ID>.p8

web の `APPLE_KEY_ID`（Apple でログインの鍵）と取り違えないよう、名前に ASC を
付けている。トークンは有効 20 分の ES256 の JWT で、要求ごとに作る。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

import jwt

BASE = "https://api.appstoreconnect.apple.com"
BUNDLE_ID = "help.mahjong.score"

# App Store Server Notifications の送り先（README「アプリ内課金」）。
# Production と Sandbox の両方に同じ URL を入れ、Version 2 を選ぶ
NOTIFICATION_URL = "https://score.mahjong.help/api/apple/notifications"

# 最初に作った非更新サブスクの 30 日パス。消耗型に作り直したあとも消さずに
# 残してあり、審査には出さない（理由は web の `record.ts` の `APPLE_PRODUCT_TYPES`）
UNSUBMITTED_PRODUCT_IDS = {"help.mahjong.score.pro.pass30"}

# App Store Connect がバージョンの編集を許している状態。audit はこの 1 つを見る。
# READY_FOR_REVIEW は、まだ送っていない下書きの提出に入っているバージョン
EDITABLE_STATES = {
    "PREPARE_FOR_SUBMISSION",
    "READY_FOR_REVIEW",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
}


def _env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        sys.exit(f"asc.py: {name} が設定されていない（--help を参照）")
    return value


def _token() -> str:
    key_id = _env("ASC_API_KEY_ID")
    path = os.environ.get("ASC_API_KEY_PATH") or os.path.expanduser(
        f"~/.appstoreconnect/private_keys/AuthKey_{key_id}.p8"
    )
    with open(path) as f:
        key = f.read()
    now = int(time.time())
    return jwt.encode(
        {"iss": _env("ASC_API_ISSUER_ID"), "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        key,
        algorithm="ES256",
        headers={"kid": key_id},
    )


def call(method: str, path: str, body: dict | None = None) -> tuple[int, dict | None]:
    url = path if path.startswith("http") else BASE + path
    req = urllib.request.Request(
        url,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": "Bearer " + _token(), "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return r.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw) if raw else None


def get(path: str) -> dict:
    status, body = call("GET", path)
    if status != 200:
        sys.exit(f"asc.py: GET {path} が {status} を返した: {json.dumps(body)[:400]}")
    return body


class Audit:
    def __init__(self) -> None:
        self.missing = 0

    def check(self, label: str, passed: bool, detail: str = "") -> None:
        if not passed:
            self.missing += 1
        print(f"{'ok     ' if passed else 'MISSING'}  {label}" + (f" — {detail}" if detail else ""))

    def note(self, label: str, detail: str) -> None:
        print(f"note     {label} — {detail}")


def audit(version: str | None) -> int:
    a = Audit()
    app = get(f"/v1/apps?filter[bundleId]={BUNDLE_ID}")["data"][0]
    app_id = app["id"]
    aa = app["attributes"]
    a.check(
        "content rights declaration",
        aa["contentRightsDeclaration"] is not None,
        str(aa["contentRightsDeclaration"]),
    )
    for field in ("subscriptionStatusUrl", "subscriptionStatusUrlForSandbox"):
        a.check(f"server notifications [{field}]", aa.get(field) == NOTIFICATION_URL, str(aa.get(field)))
    for field in ("subscriptionStatusUrlVersion", "subscriptionStatusUrlVersionForSandbox"):
        a.check(f"server notifications [{field}]", aa.get(field) == "V2", str(aa.get(field)))

    versions = get(f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS")
    candidates = [
        v
        for v in versions["data"]
        if (v["attributes"]["versionString"] == version if version else v["attributes"]["appStoreState"] in EDITABLE_STATES)
    ]
    if len(candidates) != 1:
        found = [(v["attributes"]["versionString"], v["attributes"]["appStoreState"]) for v in versions["data"]]
        sys.exit(f"asc.py: どのバージョンを見るか決められない（--version を渡す）: {found}")
    ver = candidates[0]
    va = ver["attributes"]
    print(f"app {app_id} · version {va['versionString']} ({ver['id']}) · {va['appStoreState']}")
    a.check("copyright", bool(va["copyright"]), str(va["copyright"]))
    a.note("release type", str(va["releaseType"]))

    build = get(f"/v1/appStoreVersions/{ver['id']}/build")["data"]
    if build:
        ba = build["attributes"]
        a.check(
            "build attached",
            ba["processingState"] == "VALID" and not ba["expired"],
            f"{ba['version']} {ba['processingState']}, expired {ba['expired']}, "
            f"non-exempt encryption {ba['usesNonExemptEncryption']}",
        )
    else:
        a.check("build attached", False, "バージョンにビルドが無い")

    detail = get(f"/v1/appStoreVersions/{ver['id']}/appStoreReviewDetail")["data"]
    da = detail["attributes"] if detail else {}
    fields = ("contactFirstName", "contactLastName", "contactPhone", "contactEmail")
    a.check(
        "App Review contact",
        bool(detail) and all(da.get(f) for f in fields),
        ", ".join(f"{f}={da.get(f)}" for f in fields),
    )
    # 審査員は Sandbox の購入を、許可リスト（APPLE_IAP_SANDBOX_USER_IDS）に
    # 載ったこのアカウントでしか完了できない。パスワードは中身を出さない
    a.check(
        "demo account",
        bool(da.get("demoAccountRequired")) and bool(da.get("demoAccountName")) and bool(da.get("demoAccountPassword")),
        f"required {da.get('demoAccountRequired')}, name {da.get('demoAccountName')}, "
        f"password {'set' if da.get('demoAccountPassword') else 'empty'}",
    )
    a.check("review notes", bool(da.get("notes")))

    for info in get(f"/v1/apps/{app_id}/appInfos")["data"]:
        if info["attributes"]["state"] == "READY_FOR_DISTRIBUTION":
            continue  # 公開中のバージョンの情報。準備中のものが別にある
        category = get(f"/v1/appInfos/{info['id']}/primaryCategory")["data"]
        a.check("primary category", category is not None, category["id"] if category else "")
        rating = get(f"/v1/appInfos/{info['id']}/ageRatingDeclaration")["data"]["attributes"]
        # 質問票の回答だけを見る。上書き系は既定で NONE、続きの質問（子ども向けの
        # 年齢帯・年齢制限のある SNS）は、前の質問が「はい」でない限り null のまま
        unanswered = [
            k
            for k, v in rating.items()
            if v is None
            and k
            not in {
                "kidsAgeBand",
                "socialMediaAgeRestricted",
                "gracRatingClassificationNumber",
                "developerAgeRatingInfoUrl",
            }
        ]
        a.check("age rating questionnaire", not unanswered, "unanswered: " + ", ".join(unanswered) if unanswered else "")
        a.note("computed age rating", str(info["attributes"]["appStoreAgeRating"]))
        for loc in get(f"/v1/appInfos/{info['id']}/appInfoLocalizations")["data"]:
            la = loc["attributes"]
            a.check(f"privacy policy URL [{la['locale']}]", bool(la["privacyPolicyUrl"]), str(la["privacyPolicyUrl"]))

    for loc in get(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations")["data"]:
        la = loc["attributes"]
        for field in ("description", "keywords", "supportUrl"):
            a.check(f"{field} [{la['locale']}]", bool(la[field]))
        shots = []
        for s in get(f"/v1/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")["data"]:
            shots += get(f"/v1/appScreenshotSets/{s['id']}/appScreenshots")["data"]
        states = [s["attributes"]["assetDeliveryState"]["state"] for s in shots]
        a.check(
            f"screenshots [{la['locale']}]",
            bool(states) and all(s == "COMPLETE" for s in states),
            f"{len(states)}, {sorted(set(states))}",
        )

    status, prices = call("GET", f"/v1/apps/{app_id}/appPriceSchedule")
    a.check("price schedule", status == 200 and prices["data"] is not None)
    availability = get(f"/v1/apps/{app_id}/appAvailabilityV2")["data"]
    territories = get(f"/v2/appAvailabilities/{availability['id']}/territoryAvailabilities?limit=200")["data"]
    available = sum(1 for t in territories if t["attributes"]["available"])
    a.check("territories", available > 0, f"{available} of {len(territories)} available")

    for iap in get(f"/v1/apps/{app_id}/inAppPurchasesV2?limit=200")["data"]:
        ia = iap["attributes"]
        a.note(f"in-app purchase {ia['productId']}", f"{ia['inAppPurchaseType']} {ia['state']}")
        if ia["productId"] in UNSUBMITTED_PRODUCT_IDS:
            continue
        if ia["state"] in {"APPROVED", "REMOVED_FROM_SALE", "DEVELOPER_REMOVED_FROM_SALE"}:
            continue
        a.check(f"{ia['productId']} ready to submit", ia["state"] == "READY_TO_SUBMIT", ia["state"])
        # サーバーも家族共有の取引を記録しない（README「アプリ内課金」）
        a.check(f"{ia['productId']} family sharing off", ia.get("familySharable") is not True, str(ia.get("familySharable")))
        locales = [
            loc["attributes"]["locale"]
            for loc in get(f"/v2/inAppPurchases/{iap['id']}/inAppPurchaseLocalizations")["data"]
        ]
        a.check(f"{ia['productId']} localization [ja]", "ja" in locales, ", ".join(locales))
        shot = get(f"/v2/inAppPurchases/{iap['id']}/appStoreReviewScreenshot")["data"]
        a.check(
            f"{ia['productId']} review screenshot",
            bool(shot) and shot["attributes"]["assetDeliveryState"]["state"] == "COMPLETE",
        )
        a.check(f"{ia['productId']} review note", bool(ia["reviewNote"]))

    submissions = get(f"/v1/reviewSubmissions?filter[app]={app_id}")["data"]
    a.note(
        "review submissions",
        ", ".join(f"{s['id']} {s['attributes']['state']}" for s in submissions) or "none",
    )
    # 公開 API に無い: App Privacy の回答（プライバシーラベル）は Web の画面でしか見えない
    a.note("App Privacy", "API では読めない。App Store Connect で公開済みか確かめる")
    print(f"\n{a.missing} missing")
    return 1 if a.missing else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("audit")
    p.add_argument("--version", help="見るバージョンの文字列（既定: 編集できる 1 つ）")
    for name in ("get", "delete"):
        sub.add_parser(name).add_argument("path")
    for name in ("patch", "post"):
        p = sub.add_parser(name)
        p.add_argument("path")
        p.add_argument("body", help="JSON の要求の本文")
    args = parser.parse_args()

    if args.command == "audit":
        return audit(args.version)
    body = json.loads(args.body) if args.command in ("patch", "post") else None
    status, answer = call(args.command.upper(), args.path, body)
    print(status)
    if answer is not None:
        print(json.dumps(answer, indent=1, ensure_ascii=False))
    return 0 if status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
