import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { usePlaySpin, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / SEGMENTS;

export default function SpinGame() {
  const [spinning, setSpinning] = useState(false);
  const controls = useAnimation();
  const playSpin = usePlaySpin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    
    // Start initial fast spin while waiting for API
    controls.start({
      rotate: [0, 1080],
      transition: { duration: 1, ease: "linear", repeat: Infinity }
    });

    playSpin.mutate(undefined, {
      onSuccess: async (result) => {
        const targetSegment = result.segmentIndex ?? 0;
        
        // Calculate final rotation
        // We want the target segment to end up at the top (270 degrees in SVG context, or just offset by our drawing angle)
        // Each segment is 45 deg. If target is 0, we want it at the top.
        const extraSpins = 3 * 360;
        // The top of the wheel is at 0 degrees.
        // We need to rotate backwards by the segment's starting angle, plus half a segment to center it.
        const targetRotation = extraSpins + (360 - (targetSegment * SEGMENT_ANGLE + SEGMENT_ANGLE / 2));

        controls.stop();
        await controls.start({
          rotate: targetRotation,
          transition: { duration: 3, ease: [0.2, 0.8, 0.2, 1] } // Decelerate smoothly
        });

        toast({
          title: result.won > 0 ? "Berekella!" : "Gynansakda...",
          description: result.won > 0 ? `Siz ${result.won} teňňe gazandyňyz!` : "Şu gezek bagt ýok",
        });

        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        
        setSpinning(false);
      },
      onError: (err: any) => {
        controls.stop();
        setSpinning(false);
        toast({ title: "Ýalňyşlyk", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full flex justify-start mb-8">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Yza gaýt
          </Link>
        </div>

        <h1 className="text-3xl font-bold gold-text-gradient mb-12">Pökgi aýla</h1>

        <div className="relative w-80 h-80 mb-12">
          {/* Pointer */}
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-primary filter drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
          
          <motion.div 
            animate={controls}
            className="w-full h-full rounded-full border-4 border-primary/50 relative overflow-hidden gold-glow-strong"
            style={{ transformOrigin: "center" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array.from({ length: SEGMENTS }).map((_, i) => {
                const startAngle = i * SEGMENT_ANGLE;
                const endAngle = startAngle + SEGMENT_ANGLE;
                
                // SVG coordinates math
                const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);

                const isGold = i % 2 === 0;

                return (
                  <g key={i}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={isGold ? "#D4AF37" : "#1a1a24"}
                      stroke="rgba(212,175,55,0.3)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="50"
                      y="15"
                      fill={isGold ? "#1a1a24" : "#D4AF37"}
                      fontSize="6"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(${startAngle + SEGMENT_ANGLE / 2}, 50, 50)`}
                    >
                      {i === 0 ? "BIG" : i === 4 ? "0" : "?"}
                    </text>
                  </g>
                );
              })}
              {/* Center dot */}
              <circle cx="50" cy="50" r="10" fill="#0a0a0f" stroke="#D4AF37" strokeWidth="2" />
            </svg>
          </motion.div>
        </div>

        <Button 
          onClick={handleSpin} 
          disabled={spinning}
          className="w-full max-w-[250px] h-14 text-xl gold-gradient text-black font-bold rounded-2xl"
        >
          {spinning ? "Aýlanýar..." : "Aýla"}
        </Button>
      </div>
    </Layout>
  );
}
