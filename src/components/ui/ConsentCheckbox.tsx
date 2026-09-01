export function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#FF8000] focus:ring-[#FF8000]/40"
        />
        <span>
          He leído y acepto la{' '}
          <a
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#FF8000]"
          >
            Política de Privacidad
          </a>
          .
        </span>
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
