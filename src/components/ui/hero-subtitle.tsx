type HeroSubtitleProps = {
  text: string;
};

export function HeroSubtitle({ text }: HeroSubtitleProps) {
  return (
    <p className="animate-in slide-in-from-bottom-10 fade-in mx-auto max-w-2xl fill-mode-backwards text-center text-base tracking-wider text-foreground/80 delay-200 duration-500 ease-out sm:text-lg md:text-lg">
      {text}
    </p>
  );
}
