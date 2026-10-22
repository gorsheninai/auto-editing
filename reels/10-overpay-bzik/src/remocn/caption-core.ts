// из remocn (MIT, github.com/remocn/remocn) — блок caption-core
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/* Наша версия: страницы режутся НЕ createTikTokStyleCaptions, а по флагу pageBreakAfter,
   который ставит StoryMain (2 слова, фразы по знакам, без предлога в конце) — плюс по паузе. */
export type Caption = { text: string; startMs: number; endMs: number; timestampMs?: number | null; confidence?: number | null; pageBreakAfter?: boolean };
export type TikTokPage = { text: string; startMs: number; durationMs: number; tokens: { text: string; fromMs: number; toMs: number }[] };
export type SpeakerCaption = Caption & { speaker?: string };

export interface CaptionBaseProps {
  captions: Caption[];
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  className?: string;
}

export const DEFAULT_HOLD_MS = 600;
export const MIN_SILENCE_BREAK_MS = 300;

export interface CaptionPageWindow {
  page: TikTokPage;
  index: number;
  speaker: string | undefined;
  startMs: number;
  speechEndMs: number;
  endMs: number;
  endsInSilence: boolean;
}

export type CaptionTokenStatus = "upcoming" | "active" | "spoken";

export interface CaptionTokenState {
  text: string;
  spaceBefore: boolean;
  fromMs: number;
  toMs: number;
  progress: number;
  status: CaptionTokenStatus;
}

export interface CaptionPreviousPage {
  page: TikTokPage;
  pageIndex: number;
  tokens: CaptionTokenState[];
}

export interface CaptionsState {
  page: TikTokPage;
  pageIndex: number;
  speaker: string | undefined;
  timeMs: number;
  activeIndex: number;
  tokens: CaptionTokenState[];
  sinceStartMs: number;
  untilEndMs: number;
  holdRoomMs: number;
  endsInSilence: boolean;
  previous: CaptionPreviousPage | null;
}

export interface CaptionPagingOptions {
  combineTokensWithinMilliseconds: number;
  holdMs?: number;
}

const SENTENCE_END = /[.!?…]["')\]]*$/;

export function buildCaptionPages(
  captions: SpeakerCaption[],
  {
    combineTokensWithinMilliseconds,
    holdMs = DEFAULT_HOLD_MS,
  }: CaptionPagingOptions,
): CaptionPageWindow[] {
  void combineTokensWithinMilliseconds;
  if (captions.length === 0) return [];
  const pages: TikTokPage[] = [];
  let cur: TikTokPage | null = null;
  captions.forEach((c, i) => {
    const prev = captions[i - 1];
    const gap = prev ? c.startMs - prev.endMs : 0;
    if (!cur || (prev && gap > Math.max(holdMs, MIN_SILENCE_BREAK_MS))) { cur = { text: "", startMs: c.startMs, durationMs: 0, tokens: [] }; pages.push(cur); }
    const t = (cur.tokens.length ? " " : "") + c.text.trim();
    cur.tokens.push({ text: t, fromMs: c.startMs, toMs: c.endMs });
    cur.text += t; cur.durationMs = c.endMs - cur.startMs;
    if (c.pageBreakAfter || SENTENCE_END.test(c.text.trim())) cur = null;
  });
  const speakers = new Map<number, string | undefined>();
  for (const caption of captions) {
    if (!speakers.has(caption.startMs)) {
      speakers.set(caption.startMs, caption.speaker);
    }
  }
  const spoken = pages.filter((page) => page.tokens.length > 0);
  return spoken.map((page, index) => {
    const last = page.tokens[page.tokens.length - 1];
    const speechEndMs = last ? last.toMs : page.startMs;
    const heldUntil = speechEndMs + Math.max(0, holdMs);
    const next = spoken[index + 1];
    const endsInSilence = !next || next.startMs > heldUntil;
    const endMs = endsInSilence
      ? heldUntil
      : Math.max(page.startMs, next.startMs);
    return {
      page,
      index,
      speaker: speakers.get(page.tokens[0].fromMs),
      startMs: page.startMs,
      speechEndMs,
      endMs,
      endsInSilence,
    };
  });
}

function findWindowIndex(windows: CaptionPageWindow[], timeMs: number): number {
  let lo = 0;
  let hi = windows.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (windows[mid].startMs <= timeMs) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (found === -1) return -1;
  return timeMs < windows[found].endMs ? found : -1;
}

function tokenProgress(fromMs: number, toMs: number, timeMs: number): number {
  if (timeMs < fromMs) return 0;
  if (toMs <= fromMs) return 1;
  return Math.min(1, (timeMs - fromMs) / (toMs - fromMs));
}

function getTokenStates(
  page: TikTokPage,
  timeMs: number,
): { activeIndex: number; tokens: CaptionTokenState[] } {
  let activeIndex = -1;
  page.tokens.forEach((token, i) => {
    if (token.fromMs <= timeMs) activeIndex = i;
  });
  const tokens = page.tokens.map(
    (token, i): CaptionTokenState => ({
      text: token.text.trim(),
      spaceBefore: i > 0 && /^\s/.test(token.text),
      fromMs: token.fromMs,
      toMs: token.toMs,
      progress: tokenProgress(token.fromMs, token.toMs, timeMs),
      status:
        i < activeIndex ? "spoken" : i === activeIndex ? "active" : "upcoming",
    }),
  );
  return { activeIndex, tokens };
}

export function getCaptionsState(
  windows: CaptionPageWindow[],
  timeMs: number,
): CaptionsState | null {
  const found = findWindowIndex(windows, timeMs);
  if (found === -1) return null;
  const window = windows[found];
  const { activeIndex, tokens } = getTokenStates(window.page, timeMs);
  const before = found > 0 ? windows[found - 1] : null;
  const previous =
    before && !before.endsInSilence
      ? {
          page: before.page,
          pageIndex: before.index,
          tokens: getTokenStates(before.page, before.endMs).tokens,
        }
      : null;
  return {
    page: window.page,
    pageIndex: window.index,
    speaker: window.speaker,
    timeMs,
    activeIndex,
    tokens,
    sinceStartMs: timeMs - window.startMs,
    untilEndMs: window.endMs - timeMs,
    holdRoomMs: window.endMs - window.speechEndMs,
    endsInSilence: window.endsInSilence,
    previous,
  };
}

export function getExitWindowMs(state: CaptionsState, exitMs: number): number {
  return Math.max(1, Math.min(exitMs, state.holdRoomMs));
}

export function groupCaptionWords(
  tokens: CaptionTokenState[],
): { index: number; token: CaptionTokenState }[][] {
  const words: { index: number; token: CaptionTokenState }[][] = [];
  tokens.forEach((token, index) => {
    const current = words[words.length - 1];
    if (!current || token.spaceBefore) {
      words.push([{ index, token }]);
    } else {
      current.push({ index, token });
    }
  });
  return words;
}

export function normalizeCaptionWord(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}']/gu, "");
}

export function createKeywordMatcher(
  keywords: readonly string[] = [],
): (text: string) => boolean {
  const set = new Set(keywords.map(normalizeCaptionWord).filter(Boolean));
  return (text) => set.has(normalizeCaptionWord(text));
}

export function captionWordText(word: { token: CaptionTokenState }[]): string {
  return word.map(({ token }) => token.text).join("");
}

export interface CaptionWordRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function sameRects(a: CaptionWordRect[], b: CaptionWordRect[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (r, i) =>
        r.left === b[i].left &&
        r.top === b[i].top &&
        r.width === b[i].width &&
        r.height === b[i].height,
    )
  );
}

export function useCaptionWordRects(
  pageIndex: number,
  count: number,
): {
  wordRef: (index: number) => (el: HTMLElement | null) => void;
  rects: CaptionWordRect[] | null;
} {
  const elements = useRef<(HTMLElement | null)[]>([]);
  const [measured, setMeasured] = useState<{
    pageIndex: number;
    rects: CaptionWordRect[];
  } | null>(null);

  useLayoutEffect(() => {
    if (pageIndex === -1) return;
    const rects = elements.current.slice(0, count).map((el) =>
      el
        ? {
            left: el.offsetLeft,
            top: el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight,
          }
        : { left: 0, top: 0, width: 0, height: 0 },
    );
    setMeasured((prev) =>
      prev && prev.pageIndex === pageIndex && sameRects(prev.rects, rects)
        ? prev
        : { pageIndex, rects },
    );
  });

  return {
    wordRef: (index) => (el) => {
      elements.current[index] = el;
    },
    rects: measured && measured.pageIndex === pageIndex ? measured.rects : null,
  };
}

export function useCaptions({
  captions,
  combineTokensWithinMilliseconds,
  holdMs = DEFAULT_HOLD_MS,
}: {
  captions: SpeakerCaption[];
  combineTokensWithinMilliseconds: number;
  holdMs?: number;
}): CaptionsState | null {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const windows = useMemo(
    () =>
      buildCaptionPages(captions, { combineTokensWithinMilliseconds, holdMs }),
    [captions, combineTokensWithinMilliseconds, holdMs],
  );
  return getCaptionsState(windows, (frame / fps) * 1000);
}
