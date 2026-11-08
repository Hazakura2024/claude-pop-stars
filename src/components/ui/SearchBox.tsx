"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { useSkyData } from "@/hooks/useSkyData";
import { buildSearchIndex, type SearchResult, searchSky, starLabel } from "@/lib/astro";
import { useSkyStore } from "@/store/useSkyStore";

function resultKey(r: SearchResult): string {
  return r.kind === "star" ? `star-${r.star.id}` : `con-${r.constellation.id}`;
}

/** 候補の1行。星は情報カードの「明るい星」と同じ並び（名前・符号・等級） */
function ResultRow({ result }: { result: SearchResult }) {
  if (result.kind === "constellation") {
    const c = result.constellation;
    return (
      <>
        <span className="font-bold">{c.ja}</span>
        <span className="text-ink-dim text-xs">{c.name}</span>
        <span className="font-pixel text-cyan ml-auto text-[10px] tracking-[0.2em]">星座</span>
      </>
    );
  }
  const { main, sub } = starLabel(result.star, result.star.genitive);
  return (
    <>
      <span className="font-bold">{main}</span>
      {sub && <span className="text-ink-dim text-xs">{sub}</span>}
      <span className="font-pixel text-yellow ml-auto text-xs">{result.star.mag.toFixed(2)}等</span>
    </>
  );
}

function SearchField() {
  const { starNames, constellations } = useSkyData();
  const focusOn = useSkyStore((s) => s.focusOn);
  const index = useMemo(
    () => buildSearchIndex(starNames.stars, constellations.constellations),
    [starNames, constellations],
  );

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // スマホでは🔍ボタンで開閉する（PC では常に表示）
  const [expanded, setExpanded] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchSky(index, query), [index, query]);
  const showList = open && results.length > 0;

  /**
   * 検索欄を開いてフォーカスする。iOS ではユーザー操作の中で同期的に focus しないと
   * キーボードが開かないので、flushSync で表示を確定させてからすぐに focus する
   */
  const openAndFocus = () => {
    flushSync(() => setExpanded(true));
    input.current?.focus();
  };

  // 「/」キーで検索欄へ移動する（入力欄で打っているときは除く）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || target.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      openAndFocus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const choose = (r: SearchResult) => {
    if (r.kind === "star") {
      const s = r.star;
      focusOn({ kind: "star", id: s.id, ra: s.ra, dec: s.dec, mag: s.mag, constellationId: s.con });
    } else {
      const c = r.constellation;
      const [ra, dec] = c.label;
      focusOn({ kind: "constellation", id: c.id, ra, dec, constellationId: c.id });
    }
    setQuery("");
    setOpen(false);
    setExpanded(false);
    input.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      const d = e.key === "ArrowDown" ? 1 : -1;
      setOpen(true);
      setActive((i) => (i + d + results.length) % results.length);
    } else if (e.key === "Enter" && showList) {
      e.preventDefault();
      choose(results[Math.min(active, results.length - 1)]);
    } else if (e.key === "Escape") {
      // 情報カードの Esc（window で受けている）まで届かないようにする
      e.stopPropagation();
      if (showList) setOpen(false);
      else {
        setQuery("");
        setExpanded(false);
        input.current?.blur();
      }
    }
  };

  return (
    <div className="absolute top-28 left-4 z-20 sm:top-36 sm:left-6">
      <button
        type="button"
        onClick={openAndFocus}
        aria-label="星・星座を検索"
        aria-expanded={expanded}
        className={`border-cyan/70 text-cyan hover:bg-cyan hover:text-void grid size-9 place-items-center border text-base shadow-[var(--glow-cyan)] transition-colors sm:hidden ${expanded ? "hidden" : ""}`}
      >
        ⌕
      </button>

      <div className={`w-[calc(100vw-2rem)] sm:block sm:w-72 ${expanded ? "block" : "hidden"}`}>
        <div className="neon-panel flex items-center gap-2 px-3 py-2">
          <span aria-hidden className="text-cyan text-base">
            ⌕
          </span>
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-label="星・星座を検索"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${active}` : undefined}
            value={query}
            placeholder="星・星座を検索"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // 候補のクリック（mousedown で処理）より後に閉じる
            onBlur={() => {
              setOpen(false);
              if (!query) setExpanded(false);
            }}
            onKeyDown={onKeyDown}
            className="placeholder:text-ink-dim/70 min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="font-pixel text-ink-dim border-ink-dim/40 hidden border px-1.5 text-[10px] sm:block">
            /
          </kbd>
        </div>

        {showList && (
          <ul id={listId} role="listbox" aria-label="検索結果" className="neon-panel mt-1 py-1">
            {results.map((r, i) => (
              <li
                key={resultKey(r)}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // blur より先に選ぶため mousedown で処理する
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(r);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-baseline gap-2 px-3 py-1.5 text-sm ${
                  i === active ? "bg-pink/25" : ""
                }`}
              >
                <ResultRow result={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** 星・星座の検索欄。選ぶとカメラがそこへ移動し、星座の情報カードが開く */
export function SearchBox() {
  // 星データはブラウザで読み込む。読み込み前（サーバーでの事前レンダリング中も）は出さない
  const ready = useSkyStore((s) => s.ready);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <SearchField />
    </Suspense>
  );
}
