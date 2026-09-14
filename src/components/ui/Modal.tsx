import { type ReactNode, useEffect } from 'react';
import { X } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-forest-950/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-soft-lg border border-forest-100 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-forest-100">
            <h2 className="font-serif text-lg font-medium text-forest-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50 hover:text-forest-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
