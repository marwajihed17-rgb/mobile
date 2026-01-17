import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { AnimatedBackground } from '@/components/layout/background';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
            <span className="text-white font-bold text-3xl">404</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>

          <p className="text-muted mb-8 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button>
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
