import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type InfoType = 'info' | 'success' | 'warning' | 'error';

interface NavigationInfoPanelProps {
  type?: InfoType;
  title?: string;
  message: string;
  icon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const NavigationInfoPanel = ({
  type = 'info',
  title,
  message,
  icon = true,
  dismissible = false,
  onDismiss,
  className = '',
}: NavigationInfoPanelProps) => {
  const typeStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info,
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: AlertTriangle,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: AlertCircle,
    },
  };

  const styles = typeStyles[type];
  const IconComponent = styles.icon;

  return (
    <div
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-md p-3 mb-4 flex gap-2 items-start ${className}`}
    >
      {icon && <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        {title && <strong className="block">{title}</strong>}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground ml-2 flex-shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default NavigationInfoPanel;
