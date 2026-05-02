import { useEffect, useRef } from "react";

const SYMBOLS = ["7", "★", "♦", "♥", "♣", "BAR"];
const SYM_HEX: Record<string, number> = {
  "7": 0xef4444, "★": 0xD4AF37, "♦": 0x3b82f6, "♥": 0xec4899, "♣": 0x10b981, "BAR": 0xf97316,
};

interface PixiSlotProps {
  spinning: boolean;
  finalSymbols: string[];
  onStopped?: () => void;
  accentColor?: number;
}

export function PixiSlot({ spinning, finalSymbols, onStopped, accentColor = 0x7c3aed }: PixiSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spinCbRef = useRef<(() => void) | null>(null);
  const stopCbRef = useRef<((syms: string[], cb: () => void) => void) | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let app: any = null;

    // rAF ensures layout is complete and dimensions are available
    const rafId = requestAnimationFrame(async () => {
      if (cancelled) return;

      const rect = el.getBoundingClientRect();
      const W = rect.width > 10 ? Math.floor(rect.width) : 330;
      const H = rect.height > 10 ? Math.floor(rect.height) : 200;
      const REEL_W = Math.floor(W / 3);
      const FONT_SIZE = Math.min(REEL_W * 0.58, H * 0.52, 68);

      const PIXI: any = await import("pixi.js");
      if (cancelled) return;

      const { Application, Graphics, Text } = PIXI;
      const BlurFilter = PIXI.BlurFilter ?? PIXI.filters?.BlurFilter;

      try {
        app = new Application({
          width: W, height: H,
          backgroundColor: 0x06060f,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
        });
      } catch {
        try {
          app = new Application({ width: W, height: H, backgroundColor: 0x06060f, forceCanvas: true });
        } catch { return; }
      }
      if (cancelled) { app?.destroy(true); return; }

      el.appendChild(app.view as HTMLCanvasElement);
      (app.view as HTMLCanvasElement).style.cssText = "width:100%;height:100%;display:block;";

      // Background
      const bg = new Graphics();
      bg.beginFill(0x0d0030, 0.95);
      bg.drawRect(0, 0, W, H);
      bg.endFill();
      const ambientGlow = new Graphics();
      ambientGlow.beginFill(accentColor, 0.06);
      ambientGlow.drawEllipse(W / 2, H / 2, W * 0.55, H * 0.65);
      ambientGlow.endFill();
      app.stage.addChild(bg);
      app.stage.addChild(ambientGlow);

      const reelData: Array<{
        text: any; blur: any;
        phase: "idle" | "fast" | "stopping" | "done";
        tickCount: number; stoppedAt: number; finalSym: string;
      }> = [];

      for (let ri = 0; ri < 3; ri++) {
        const cx = ri * REEL_W + REEL_W / 2;
        const cy = H / 2;

        const cellBg = new Graphics();
        cellBg.beginFill(0x08001a, 0.85);
        cellBg.drawRoundedRect(ri * REEL_W + 5, 5, REEL_W - 10, H - 10, 14);
        cellBg.endFill();
        cellBg.lineStyle(1.5, accentColor, 0.32);
        cellBg.drawRoundedRect(ri * REEL_W + 5, 5, REEL_W - 10, H - 10, 14);
        app.stage.addChild(cellBg);

        const mask = new Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(ri * REEL_W + 5, 5, REEL_W - 10, H - 10, 14);
        mask.endFill();
        app.stage.addChild(mask);

        const initSym = SYMBOLS[ri % SYMBOLS.length] ?? "★";
        const text = new Text(initSym, {
          fontFamily: "Arial Black, Arial Bold, Arial",
          fontSize: FONT_SIZE,
          fill: SYM_HEX[initSym] ?? 0xffffff,
          fontWeight: "900",
        });
        text.anchor.set(0.5);
        text.x = cx;
        text.y = cy;
        text.mask = mask;
        app.stage.addChild(text);

        const blur = BlurFilter ? new BlurFilter(0, 10) : null;
        if (blur) { blur.blurY = 0; text.filters = [blur]; }

        reelData.push({ text, blur, phase: "idle", tickCount: 0, stoppedAt: 0, finalSym: initSym });
      }

      const winLine = new Graphics();
      winLine.lineStyle(2.5, 0xD4AF37, 0.65);
      winLine.moveTo(8, H / 2);
      winLine.lineTo(W - 8, H / 2);
      winLine.alpha = 0.3;
      app.stage.addChild(winLine);

      const border = new Graphics();
      border.lineStyle(2, accentColor, 0.5);
      border.drawRect(0, 0, W, H);
      app.stage.addChild(border);

      let winPulse = 0;
      let pulsing = false;

      app.ticker.add((delta: number) => {
        for (const r of reelData) {
          if (r.phase === "idle" || r.phase === "done") continue;
          r.tickCount += delta;

          if (r.phase === "fast") {
            if (Math.floor(r.tickCount * 10) % 3 === 0) {
              const next = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? "★";
              r.text.text = next;
              if (r.text.style) r.text.style.fill = SYM_HEX[next] ?? 0xffffff;
            }
            if (r.blur) r.blur.blurY = 18;
            r.text.scale.set(1);
          } else if (r.phase === "stopping") {
            const elapsed = r.tickCount - r.stoppedAt;
            const rate = Math.max(1, Math.ceil(14 - elapsed / 2.5));
            if (Math.floor(r.tickCount) % rate === 0) {
              const next = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? "★";
              r.text.text = next;
              if (r.text.style) r.text.style.fill = SYM_HEX[next] ?? 0xffffff;
            }
            if (r.blur) r.blur.blurY = Math.max(0, 16 - elapsed * 0.8);
            if (elapsed > 24) {
              r.text.text = r.finalSym;
              if (r.text.style) r.text.style.fill = SYM_HEX[r.finalSym] ?? 0xffffff;
              if (r.blur) r.blur.blurY = 0;
              r.phase = "done";
              pulsing = true;
              let b = 0;
              const bId = app.ticker.add(() => {
                b++;
                const s = 1 + Math.sin(b * 0.55) * 0.3 * Math.exp(-b * 0.13);
                r.text.scale.set(s);
                if (b > 22) { r.text.scale.set(1); app.ticker.remove(bId); }
              });
            }
          }
        }
        if (pulsing) {
          winPulse += 0.09;
          winLine.alpha = 0.25 + 0.55 * Math.abs(Math.sin(winPulse));
        }
      });

      spinCbRef.current = () => {
        reelData.forEach(r => { r.phase = "fast"; r.tickCount = 0; });
      };
      stopCbRef.current = (syms: string[], cb: () => void) => {
        syms.forEach((sym, ri) => {
          setTimeout(() => {
            const r = reelData[ri];
            if (!r) return;
            r.finalSym = sym;
            r.phase = "stopping";
            r.stoppedAt = r.tickCount;
            if (ri === syms.length - 1) setTimeout(cb, 900);
          }, ri * 380);
        });
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      spinCbRef.current = null;
      stopCbRef.current = null;
      if (app) { try { app.destroy(true, { children: true }); } catch {} }
      const canvas = el.querySelector("canvas");
      if (canvas) el.removeChild(canvas);
    };
  }, []);

  useEffect(() => { if (spinning) spinCbRef.current?.(); }, [spinning]);

  useEffect(() => {
    if (finalSymbols.length > 0) {
      stopCbRef.current?.(finalSymbols, () => onStopped?.());
    }
  }, [finalSymbols]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
}
