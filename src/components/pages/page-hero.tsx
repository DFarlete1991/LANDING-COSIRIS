import { HeroSection, LogosSection } from '@/components/ui/hero-1';

export function HeroPage() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-between pb-0 md:pb-12">
      <div className="flex flex-1 items-center">
        <HeroSection />
      </div>
      <LogosSection />
    </section>
  );
}
