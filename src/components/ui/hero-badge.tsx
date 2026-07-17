import { ArrowRightIcon, RocketIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeroBadgeProps = {
  text: string;
  href?: string;
};

export function HeroBadge({ text, href = '#' }: HeroBadgeProps) {
  return (
    <a
      className={cn(
        'group mx-auto flex w-fit items-center gap-3 rounded-full border bg-white px-3 py-1 shadow',
        'animate-in slide-in-from-bottom-10 fade-in fill-mode-backwards delay-500 duration-500 ease-out',
      )}
      href={href}
    >
      <RocketIcon className="size-3 text-slate-500" />
      <span className="text-xs">{text}</span>
      <span className="block h-5 border-l" />
      <ArrowRightIcon className="size-3 duration-150 ease-out group-hover:translate-x-1" />
    </a>
  );
}
