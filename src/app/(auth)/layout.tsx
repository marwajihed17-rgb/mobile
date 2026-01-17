import { AnimatedBackground } from '@/components/layout/background';
import { BrandFooter } from '@/components/layout/footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <main className="min-h-screen flex items-center justify-center p-6">
        {children}
      </main>
      <BrandFooter />
    </div>
  );
}
