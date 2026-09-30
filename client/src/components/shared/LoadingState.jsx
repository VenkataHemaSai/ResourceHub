import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-muted-foreground animate-in fade-in duration-500">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-[50vh] flex items-center justify-center">{content}</div>;
  }
  return content;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-[100px] w-full" />
    </div>
  );
}
