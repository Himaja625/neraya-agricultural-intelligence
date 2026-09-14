import { Sprout } from './Icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 18, text: 'text-base' },
    md: { icon: 24, text: 'text-lg' },
    lg: { icon: 32, text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <div className="flex items-center justify-center rounded-xl bg-forest-700 text-white" style={{ width: s.icon + 12, height: s.icon + 12 }}>
          <Sprout size={s.icon} strokeWidth={2} />
        </div>
      </div>
      {showText && (
        <span className={`font-serif font-semibold tracking-tightish text-forest-900 ${s.text}`}>
          Neraya
        </span>
      )}
    </div>
  );
}
