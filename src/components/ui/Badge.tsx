interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variants = {
    default: 'bg-forest-50 text-forest-700 border-forest-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    error: 'bg-error-50 text-error-700 border-error-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-sand-100 text-sand-700 border-sand-200',
  };
  const sizes = {
    sm: 'text-2xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
