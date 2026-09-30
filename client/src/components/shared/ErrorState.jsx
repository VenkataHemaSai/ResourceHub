import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errorMessages';

export function ErrorState({ error, message, onRetry }) {
  const displayMessage = message || (error?.code ? getErrorMessage(error.code) : getErrorMessage('default'));

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-destructive/20 bg-destructive/5 animate-in fade-in duration-500">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-semibold tracking-tight text-destructive">Something went wrong</h3>
      <p className="text-sm text-destructive/80 mt-2 max-w-md">
        {displayMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 border-destructive/30 text-destructive hover:bg-destructive/10">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
