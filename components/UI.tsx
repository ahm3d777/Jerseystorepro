
import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'black';
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
  // Modern Pill Shape (rounded-full)
  const baseStyle = "px-8 py-3 relative overflow-hidden rounded-full font-heading font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs uppercase tracking-widest group active:scale-[0.98]";
  
  const shineEffect = <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none z-0" />;

  const variants = {
    primary: "bg-brand-crimson text-white hover:bg-brand-crimsonDark shadow-md shadow-brand-crimson/20 hover:shadow-lg hover:shadow-brand-crimson/30 hover:-translate-y-[1px]",
    secondary: "bg-brand-royal text-white hover:bg-brand-royalLight shadow-md shadow-brand-royal/20 hover:-translate-y-[1px]",
    black: "bg-brand-dark text-white hover:bg-black shadow-md shadow-black/20 hover:-translate-y-[1px]",
    outline: "border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-colors bg-transparent",
    ghost: "bg-transparent text-gray-600 hover:text-brand-dark hover:bg-gray-50"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {(variant === 'primary' || variant === 'secondary' || variant === 'black') && shineEffect}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  type?: 'new' | 'sale' | 'preorder' | 'default' | 'player';
}

export const Badge: React.FC<BadgeProps> = ({ children, type = 'default' }) => {
  const styles = {
    new: "bg-brand-royal text-white shadow-sm shadow-brand-royal/30",
    sale: "bg-brand-crimson text-white shadow-sm shadow-brand-crimson/30",
    preorder: "bg-brand-gold text-white shadow-sm shadow-brand-gold/30",
    player: "bg-brand-dark text-brand-gold border border-brand-gold/50 shadow-md shadow-brand-gold/20",
    default: "bg-gray-100 text-gray-600"
  };

  return (
    <span className={`text-[9px] font-heading font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${styles[type]} transform transition-transform hover:scale-105`}>
      {children}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-gray-100 relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shine -translate-x-full" />
  </div>
);

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0, threshold = 0.1 }) => {
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
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[200] flex flex-col gap-3">
      {notifications.map(note => (
        <div 
          key={note.id}
          className="bg-brand-dark text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-slide-up sm:min-w-[300px]"
        >
          {note.type === 'success' ? <CheckCircle className="text-green-400" size={20} /> : note.type === 'error' ? <AlertCircle className="text-red-400" size={20} /> : <Info className="text-brand-gold" size={20} />}
          <p className="text-sm font-bold flex-1">{note.message}</p>
          <button onClick={() => removeNotification(note.id)} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
