'use client';

export function BrandFooter() {
  return (
    <div
      className="fixed bottom-4 z-30
      flex items-center gap-3 px-4 py-2
      text-xs text-muted
      bg-background/80 backdrop-blur-sm
      rounded-full"
      style={{
        // RTL-aware positioning using logical properties
        insetInlineStart: '1rem'
      }}
    >
      <span className="w-6 h-0.5 rounded-full bg-gradient-to-r from-[#2B91D9] via-[#8B4FA8] to-[#2B91D9]" />
      <a
        href="https://www.retaam-solutions.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground transition-colors"
      >
        Retaam Solutions
      </a>
    </div>
  );
}
