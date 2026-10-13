import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'black';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button'
}) => {
  const baseStyle =
    'px-7 py-3.5 relative overflow-hidden rounded-full font-headline-md text-label-numeric font-bold transition-all duration-300 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 uppercase tracking-wider group active:scale-95';

  const shineEffect = (
    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none z-0" />
  );

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-primary-container hover:bg-crimson-vibrant text-on-primary-container shadow-lg shadow-primary-container/25 hover:shadow-primary-container/40',
    gold:
      'bg-secondary hover:bg-secondary-fixed text-on-secondary shadow-lg shadow-secondary/20 hover:shadow-secondary/35',
    secondary:
      'bg-surface-charcoal-elevated hover:bg-surface-container-high text-on-surface border border-surface-border shadow-md',
    black:
      'bg-surface-charcoal hover:bg-primary-container text-on-surface hover:text-on-primary-container border border-surface-border hover:border-primary-container shadow-lg',
    outline:
      'border border-surface-border bg-surface-charcoal/80 text-on-surface hover:border-primary-container hover:text-primary backdrop-blur-md',
    ghost:
      'bg-transparent text-text-muted hover:text-on-surface hover:bg-surface-charcoal'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {(variant === 'primary' || variant === 'gold' || variant === 'black') && shineEffect}
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  type?: 'new' | 'sale' | 'preorder' | 'default' | 'player' | 'gold' | 'tertiary';
}

export const Badge: React.FC<BadgeProps> = ({ children, type = 'default' }) => {
  const styles: Record<NonNullable<BadgeProps['type']>, string> = {
    new: 'bg-tertiary-container/40 text-tertiary border border-tertiary/30',
    sale: 'bg-primary-container text-on-primary-container shadow-sm',
    preorder: 'bg-secondary text-on-secondary shadow-sm',
    player: 'bg-primary-container text-on-primary-container shadow-sm',
    gold: 'bg-secondary text-on-secondary shadow-sm',
    tertiary: 'bg-surface-charcoal-elevated text-tertiary border border-surface-border',
    default: 'bg-surface-charcoal-elevated text-on-surface-variant border border-surface-border'
  };

  return (
    <span
      className={`font-label-caps text-label-caps uppercase font-bold px-2.5 py-0.5 rounded ${styles[type]}`}
    >
      {children}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-surface-container relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine -translate-x-full" />
  </div>
);

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  threshold = 0.08
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {notifications.map((note) => (
        <div
          key={note.id}
          className="pointer-events-auto bg-surface-charcoal-elevated/95 backdrop-blur-xl text-on-surface border border-surface-border px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-slide-up sm:min-w-[320px]"
        >
          {note.type === 'success' ? (
            <div className="w-7 h-7 rounded-lg bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
              <CheckCircle size={16} />
            </div>
          ) : note.type === 'error' ? (
            <div className="w-7 h-7 rounded-lg bg-error-container/40 text-error flex items-center justify-center shrink-0">
              <AlertCircle size={16} />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
              <Info size={16} />
            </div>
          )}
          <p className="font-body-sm text-body-sm font-semibold text-on-surface flex-1">{note.message}</p>
          <button
            onClick={() => removeNotification(note.id)}
            className="text-text-muted hover:text-on-surface transition-colors p-1"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
