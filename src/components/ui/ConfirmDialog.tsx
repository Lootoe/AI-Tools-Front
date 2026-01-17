import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ConfirmDialogType = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const iconMap = {
  danger: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  danger: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#ef4444',
    button: 'linear-gradient(135deg, #ef4444, #dc2626)',
    buttonShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '#f59e0b',
    button: 'linear-gradient(135deg, #f59e0b, #d97706)',
    buttonShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: '#3b82f6',
    button: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    buttonShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'danger',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const Icon = iconMap[type];
  const colors = colorMap[type];

  const dialogContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in"
        style={{
          backgroundColor: 'rgba(15, 15, 25, 0.95)',
          border: '1px solid rgba(60, 60, 80, 0.5)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`
            }}
          >
            <Icon size={20} style={{ color: colors.icon }} />
          </div>
          <h3 className="text-lg font-bold text-white">
            {title}
          </h3>
        </div>
        <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(60, 60, 80, 0.5)',
              color: '#9ca3af'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              e.currentTarget.style.color = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(60, 60, 80, 0.5)';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all"
            style={{
              background: colors.button,
              boxShadow: colors.buttonShadow
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};
