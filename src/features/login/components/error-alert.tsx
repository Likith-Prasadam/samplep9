interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm backdrop-blur-sm">
      {message}
    </div>
  );
  // Alternative with UI Alert if available:
  // <Alert variant="destructive">
  //   <AlertDescription>{message}</AlertDescription>
  // </Alert>
}
