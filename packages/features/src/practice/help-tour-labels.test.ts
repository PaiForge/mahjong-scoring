import { describe, expect, it } from "vitest";

import { practiceHelpTourLabels } from "./help-tour-labels";

describe("practiceHelpTourLabels", () => {
  it("練習の辞書の help.* と tour.progress、common の close から組む", () => {
    const t = (key: string, values?: Readonly<Record<string, number>>) =>
      values ? `${key}:${values.current}/${values.total}` : key;
    const labels = practiceHelpTourLabels(t, (key) => `common.${key}`);

    expect(labels.prev).toBe("help.prev");
    expect(labels.next).toBe("help.next");
    expect(labels.close).toBe("common.close");
    expect(labels.progress(2, 5)).toBe("tour.progress:2/5");
  });
});
