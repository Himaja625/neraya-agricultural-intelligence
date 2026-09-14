import { Loader2 } from './Icons';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export default function LoadingState({ label = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <Loader2 className="h-6 w-6 text-forest-400 animate-spin" />
      <p className="mt-3 text-sm text-forest-500">{label}</p>
    </div>
  );
}
