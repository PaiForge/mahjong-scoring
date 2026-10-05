import { describe, expect, it } from "vitest";

import {
  isReservationTooLateForSession,
  reservationExpiresAt,
} from "../checkout-window";

const NOW = new Date("2026-10-04T12:00:00.750Z");
const MINUTE = 60 * 1000;

describe("reservationExpiresAt", () => {
  it("1 時間後を秒に切り捨てて返す", () => {
    expect(reservationExpiresAt(NOW)).toEqual(
      new Date("2026-10-04T13:00:00.000Z"),
    );
  });
});

describe("isReservationTooLateForSession", () => {
  const at = (msFromNow: number) => new Date(NOW.getTime() + msFromNow);

  it("Session 未作成で残りが 30 分ちょうど以下なら失効扱い", () => {
    expect(
      isReservationTooLateForSession(
        { stripeCheckoutSessionId: null, expiresAt: at(30 * MINUTE) },
        NOW,
      ),
    ).toBe(true);
    expect(
      isReservationTooLateForSession(
        { stripeCheckoutSessionId: null, expiresAt: at(30 * MINUTE + 1) },
        NOW,
      ),
    ).toBe(false);
  });

  it("Session 作成済みなら残り時間に関わらず Stripe の状態に任せる", () => {
    expect(
      isReservationTooLateForSession(
        { stripeCheckoutSessionId: "cs_test", expiresAt: at(-MINUTE) },
        NOW,
      ),
    ).toBe(false);
  });
});
