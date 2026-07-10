"use client";

/**
 * ツモ点数の2段表示（"1000/2000" は子/親、"2600∀" はオール表記）
 * ツモ点数表示
 */
export function TsumoScore({ score }: { readonly score: string | number }) {
  if (typeof score !== "string") return <>{score}</>;
  const text = score.replace("∀", "");
  if (text.includes("/")) {
    const [ko, oya] = text.split("/");
    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{ko} /</span>
        <span>{oya}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center leading-tight">
      <span>
        {text}
        {"∀"}
      </span>
    </div>
  );
}
