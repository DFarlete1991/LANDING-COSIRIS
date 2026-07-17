export function FormNavbar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-center bg-white/80 backdrop-blur-lg md:h-20">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        className="transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <img src="/assets/logo_orange.png" alt="Cosiris" className="h-9 w-auto md:h-11" />
      </a>
    </header>
  );
}