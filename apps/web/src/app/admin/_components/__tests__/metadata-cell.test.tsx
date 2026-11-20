import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MetadataCell } from "../metadata-cell";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

afterEach(cleanup);

function renderCell(metadata: Record<string, unknown> | null) {
  const { container } = render(
    <table>
      <tbody>
        <tr>{MetadataCell({ metadata })}</tr>
      </tbody>
    </table>,
  );
  return container;
}

describe("MetadataCell", () => {
  it.each([null, {}])("空の metadata（%j）は「-」を出す", (metadata) => {
    renderCell(metadata);

    expect(screen.getByText("-")).toBeTruthy();
  });
});
