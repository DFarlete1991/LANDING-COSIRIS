import { LandingNavbar } from '@/components/pages/landing-navbar';
import { HeroPage } from '@/components/pages/page-hero';
import { EvolutionPage } from '@/components/pages/page-evolution';
import { AuthorityPage } from '@/components/pages/page-authority';
import { Footer } from '@/components/Footer';

export default function LandingPages() {
  return (
    <div className="relative flex w-full flex-col">
      <LandingNavbar />

      <main className="relative z-20 grow">
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 mx-auto hidden w-full max-w-5xl lg:block"
          >
            <div className="absolute inset-y-0 left-0 w-px bg-slate-200" />
            <div className="absolute inset-y-0 right-0 w-px bg-slate-200" />
            <div className="absolute inset-y-0 left-6 w-px bg-slate-200/50" />
            <div className="absolute inset-y-0 right-6 w-px bg-slate-200/50" />
          </div>
          <HeroPage />
        </div>
        <EvolutionPage />

        <AuthorityPage />
        <Footer />
      </main>
    </div>
  );
}
