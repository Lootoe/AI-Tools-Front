import React from 'react';
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
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-500',
    button: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-500',
    button: 'bg-yellow-500 hover:bg-yellow-600',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-500',
    button: 'bg-blue-500 hover:bg-blue-600',
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
            <Icon size={20} className={colors.icon} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white ${colors.button} rounded-xl transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
