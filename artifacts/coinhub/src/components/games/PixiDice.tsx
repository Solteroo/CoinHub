import { useEffect, useRef } from "react";

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]],
};

interface PixiDiceProps {
  rolling: boolean;
  finalDice: [number, number] | null;
  onRolled?: () => void;
  accentColor?: number;
}

export function PixiDice({ rolling, finalDice, onRolled, accentColor = 0x10b981 }: PixiDiceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rollCbRef = useRef<(() => void) | null>(null);
  const stopCbRef = useRef<((d: [number, number], cb: () => void) => void) | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let app: any = null;

    const rafId = requestAnimationFrame(async () => {
      if (cancelled) return;

      const rect = el.getBoundingClientRect();
      const W = rect.width > 10 ? Math.floor(rect.width) : 300;
      const H = rect.height > 10 ? Math.floor(rect.height) : 180;
      const DIE_SIZE = Math.min(W * 0.33, H * 0.72, 120);
      const DOT_R = DIE_SIZE * 0.09;

      const PIXI: any = await import("pixi.js");
      if (cancelled) return;

      const { Application, Graphics, Text, Container } = PIXI;
      const BlurFilter = PIXI.BlurFilter ?? PIXI.filters?.BlurFilter;

      try {
        app = new Application({
          width: W, height: H,
          backgroundColor: 0x020810,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
        });
      } catch {
        try { app = new Application({ width: W, height: H, backgroundColor: 0x020810, forceCanvas: true }); }
        catch { return; }
      }
      if (cancelled) { app?.destroy(true); return; }

      el.appendChild(app.view as HTMLCanvasElement);
      (app.view as HTMLCanvasElement).style.cssText = "width:100%;height:100%;display:block;";

      const ambient = new Graphics();
      ambient.beginFill(accentColor, 0.05);
      ambient.drawEllipse(W / 2, H / 2, W * 0.5, H * 0.6);
      ambient.endFill();
      app.stage.addChild(ambient);

      function makeDice(cx: number, cy: number, initVal: number) {
        const dc = new Container();
        dc.x = cx; dc.y = cy;

        const bg = new Graphics();
        bg.beginFill(0x0e1a1e, 0.9);
        bg.lineStyle(2.5, accentColor, 0.5);
        bg.drawRoundedRect(-DIE_SIZE / 2, -DIE_SIZE / 2, DIE_SIZE, DIE_SIZE, DIE_SIZE * 0.18);
        bg.endFill();
        dc.addChild(bg);

        const dotsG = new Graphics();
        dc.addChild(dotsG);

        function drawDots(val: number) {
          dotsG.clear();
          const dots = DICE_DOTS[val] ?? DICE_DOTS[1]!;
          for (const [dx, dy] of dots) {
            dotsG.beginFill(accentColor, 1);
            dotsG.drawCircle((dx - 0.5) * DIE_SIZE * 0.72, (dy - 0.5) * DIE_SIZE * 0.72, DOT_R);
            dotsG.endFill();
          }
        }

        drawDots(initVal);
        app.stage.addChild(dc);

        const blur = BlurFilter ? new BlurFilter(0, 8) : null;
        if (blur) { blur.blurY = 0; dc.filters = [blur]; }

        return { dc, dotsG, drawDots, blur };
      }

      const gap = W * 0.08;
      const cx1 = W / 2 - DIE_SIZE * 0.6 - gap / 2;
      const cx2 = W / 2 + DIE_SIZE * 0.6 + gap / 2;
      const d1 = makeDice(cx1, H / 2, 1);
      const d2 = makeDice(cx2, H / 2, 1);

      const sumText = new Text("?", {
        fontFamily: "Arial Black, Arial Bold",
        fontSize: Math.min(H * 0.28, 38),
        fill: 0xffffff,
        fontWeight: "900",
      });
      sumText.anchor.set(0.5);
      sumText.x = W / 2;
      sumText.y = H * 0.88;
      sumText.alpha = 0;
      app.stage.addChild(sumText);

      let phase: "idle" | "rolling" | "done" = "idle";
      let rot1 = 0; let rot2 = 0;
      let symTick = 0;

      app.ticker.add((delta: number) => {
        if (phase !== "rolling") return;
        symTick += delta;
        rot1 = (rot1 + delta * 0.18) % (Math.PI * 2);
        rot2 = (rot2 + delta * 0.22) % (Math.PI * 2);
        d1.dc.rotation = rot1;
        d2.dc.rotation = rot2;
        if (d1.blur) d1.blur.blurY = 12;
        if (d2.blur) d2.blur.blurY = 12;
        if (Math.floor(symTick * 10) % 4 === 0) {
          d1.drawDots(Math.ceil(Math.random() * 6));
          d2.drawDots(Math.ceil(Math.random() * 6));
        }
      });

      rollCbRef.current = () => {
        phase = "rolling";
        symTick = 0;
        rot1 = 0; rot2 = 0;
        sumText.alpha = 0;
        d1.dc.rotation = 0;
        d2.dc.rotation = 0;
        if (d1.blur) d1.blur.blurY = 0;
        if (d2.blur) d2.blur.blurY = 0;
      };

      stopCbRef.current = (faces: [number, number], cb: () => void) => {
        phase = "done";
        setTimeout(() => {
          d1.drawDots(faces[0]);
          d1.dc.rotation = 0;
          if (d1.blur) d1.blur.blurY = 0;
        }, 200);
        setTimeout(() => {
          d2.drawDots(faces[1]);
          d2.dc.rotation = 0;
          if (d2.blur) d2.blur.blurY = 0;
          const sum = faces[0] + faces[1];
          sumText.text = `${faces[0]} + ${faces[1]} = ${sum}`;
          if (sumText.style) sumText.style.fill = sum >= 8 ? 0x34d399 : sum <= 6 ? 0x60a5fa : 0xffffff;
          let fadeIn = 0;
          const fId = app.ticker.add(() => {
            fadeIn++; sumText.alpha = Math.min(1, fadeIn * 0.1);
            if (fadeIn > 12) app.ticker.remove(fId);
          });
          for (const d of [d1, d2]) {
            let b = 0;
            const bId = app.ticker.add(() => {
              b++;
              const s = 1 + Math.sin(b * 0.5) * 0.22 * Math.exp(-b * 0.13);
              d.dc.scale.set(s);
              if (b > 20) { d.dc.scale.set(1); app.ticker.remove(bId); }
            });
          }
          setTimeout(cb, 600);
        }, 500);
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      rollCbRef.current = null;
      stopCbRef.current = null;
      if (app) { try { app.destroy(true, { children: true }); } catch {} }
      const canvas = el.querySelector("canvas");
      if (canvas) el.removeChild(canvas);
    };
  }, []);

  useEffect(() => { if (rolling) rollCbRef.current?.(); }, [rolling]);

  useEffect(() => {
    if (finalDice) stopCbRef.current?.(finalDice, () => onRolled?.());
  }, [finalDice]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
}
