import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}>
      {icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 text-forest-400">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-xl font-medium text-forest-900 mb-2">{title}</h3>
      <p className="text-sm text-forest-500 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
