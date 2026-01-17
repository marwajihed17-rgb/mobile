'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Orb 1 - Primary Blue */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full
        bg-primary opacity-[0.08] blur-[100px]
        -top-[200px] -right-[200px] animate-pulse-slow"
      />

      {/* Orb 2 - Secondary Purple */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full
        bg-secondary opacity-[0.06] blur-[100px]
        -bottom-[150px] -left-[150px] animate-pulse-slow"
        style={{ animationDelay: '2s' }}
      />

      {/* Orb 3 - Cyan */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full
        bg-cyan-400 opacity-[0.05] blur-[100px]
        top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        animate-pulse-slow"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}
