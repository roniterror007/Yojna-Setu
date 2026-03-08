'use client';

export default function LoadingDots() {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bharat-green/20 border border-bharat-green/30 flex items-center justify-center">
        <span className="text-bharat-green text-xs">Y</span>
      </div>
      <div className="bg-bharat-card border border-bharat-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-bharat-green/60"
              style={{
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
