import React, { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const iconMap = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.4)',
    icon: '#22c55e',
    text: '#22c55e',
  },
  error: {
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.4)',
    icon: '#ef4444',
    text: '#f87171',
  },
  warning: {
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.4)',
    icon: '#f59e0b',
    text: '#fbbf24',
  },
  info: {
    bg: 'rgba(0,245,255,0.15)',
    border: 'rgba(0,245,255,0.4)',
    icon: '#00f5ff',
    text: '#00f5ff',
  },
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 2000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待动画结束
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${colors.icon}20` }}
      >
        <Icon size={12} style={{ color: colors.icon }} />
      </div>
      <span className="text-sm font-medium" style={{ color: colors.text }}>
        {message}
      </span>
    </div>
  );
};

// Toast管理Hook
interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};
