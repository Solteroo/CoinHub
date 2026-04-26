import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-10 h-10 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]", className)}
    >
      <circle cx="50" cy="50" r="46" fill="url(#gold-grad-1)" stroke="url(#gold-grad-2)" strokeWidth="4"/>
      <circle cx="50" cy="50" r="38" fill="url(#dark-grad)" stroke="url(#gold-grad-1)" strokeWidth="1"/>
      <path d="M65 35C60 30 52 28 45 30C38 32 32 38 30 45C28 52 30 60 35 65C40 70 48 72 55 70C62 68 68 62 70 55" stroke="url(#gold-grad-2)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M45 40V60" stroke="url(#gold-grad-1)" strokeWidth="4" strokeLinecap="round"/>
      <path d="M55 40V60" stroke="url(#gold-grad-1)" strokeWidth="4" strokeLinecap="round"/>
      
      <defs>
        <linearGradient id="gold-grad-1" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3E5AB" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="gold-grad-2" x1="80" y1="20" x2="20" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF8D6" />
          <stop offset="0.5" stopColor="#DAA520" />
          <stop offset="1" stopColor="#8B6508" />
        </linearGradient>
        <linearGradient id="dark-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a1a24" />
          <stop offset="1" stopColor="#0a0a0f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
