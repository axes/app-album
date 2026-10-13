"use client";

import { useMemo, useState } from "react";

const FOIL_STICKERS = new Set([1, 8, 16, 24]);
const INITIAL_STATES: Readonly<Record<number, 0 | 1 | 2>> = {
  1: 1, 2: 1, 3: 2, 4: 1, 5: 0, 6: 1, 7: 2, 8: 1,
  9: 0, 10: 1, 11: 1, 12: 0, 13: 1, 14: 0, 15: 1, 16: 0,
  17: 1, 18: 2, 19: 0, 20: 1, 21: 1, 22: 0, 23: 1, 24: 0,
};

type StickerState = 0 | 1 | 2;
type Filter = "all" | "missing" | "duplicate";

const STATE_LABELS: Readonly<Record<StickerState, string>> = {
  0: "me falta",
  1: "pegada",
  2: "repetida",
};

export function StickerDemo() {
  const [states, setStates] = useState<Record<number, StickerState>>({ ...INITIAL_STATES });
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(() => {
    const values = Object.values(states);
    const owned = values.filter((state) => state > 0).length;
    return {
      owned,
      missing: values.length - owned,
      duplicate: values.filter((state) => state === 2).length,
      percent: Math.round((owned / values.length) * 100),
    };
  }, [states]);
  const dashOffset = 163.4 * (1 - counts.percent / 100);

  function cycle(number: number) {
    setStates((current) => ({
      ...current,
      [number]: ((current[number] + 1) % 3) as StickerState,
    }));
  }

  return (
    <div className="proposal-card">
      <div className="proposal-head">
        <div className="proposal-head-main">
          <div className="proposal-ring">
            <svg viewBox="0 0 64 64" role="progressbar" aria-label={`${counts.percent}% completado`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={counts.percent}>
              <circle className="proposal-ring-track" cx="32" cy="32" r="26" />
              <circle className="proposal-ring-value" cx="32" cy="32" r="26" style={{ strokeDashoffset: dashOffset }} />
            </svg>
            <b>{counts.percent}%</b>
          </div>
          <div><h3 className="proposal-type-title">Mundial 2026</h3><div className="proposal-type-caption">Página 1 · 24 láminas</div></div>
        </div>
      </div>
      <div className="proposal-stats"><div><b>{counts.owned}</b><span>Pegadas</span></div><div><b>{counts.missing}</b><span>Me faltan</span></div><div><b>{counts.duplicate}</b><span>Repetidas</span></div></div>
      <div className="proposal-filters" role="group" aria-label="Filtro de láminas">
        {([[
          "all", "Todas",
        ], ["missing", "Me faltan"], ["duplicate", "Repetidas"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
      </div>
      <div className="proposal-slots">
        {Array.from({ length: 24 }, (_, index) => index + 1).map((number) => {
          const state = states[number];
          const foil = FOIL_STICKERS.has(number);
          const hidden = (filter === "missing" && state !== 0) || (filter === "duplicate" && state !== 2);
          return <button type="button" key={number} hidden={hidden} onClick={() => cycle(number)} className={["sticker", state > 0 ? "sticker-owned" : "", state === 2 ? "sticker-duplicate" : "", foil ? "sticker-foil" : ""].filter(Boolean).join(" ")} aria-label={`Lámina ${number}${foil ? " especial" : ""}, ${STATE_LABELS[state]}`}>{number}{state === 2 && <span className="sticker-count">×2</span>}</button>;
        })}
      </div>
    </div>
  );
}
