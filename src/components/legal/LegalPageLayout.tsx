import { ArrowLeft } from 'lucide-react';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/lib/seo';

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  path: string;
}

export function LegalPageLayout({ children, title, path }: LegalPageLayoutProps) {
  useSEO({
    path,
    title: `${title} | Cosiris`,
    description: `${title} de Cosiris, agencia de marketing especializada en el sector inmobiliario.`,
  });

  const handleGoBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      <LandingNavbar />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </button>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-12">{title}</h1>
        <div className="space-y-8 text-sm leading-relaxed text-slate-600">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
