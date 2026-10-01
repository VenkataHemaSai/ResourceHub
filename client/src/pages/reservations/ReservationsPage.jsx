import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatOrgDate } from '@/api/dates';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function ReservationCard({ reservation, onCancel, cancelling, timezone }) {
  const isCancelled = reservation.status === 'CANCELLED';
  const tz = timezone || 'UTC';

  return (
    <Card className={`flex flex-col border-border/50 bg-card/50 backdrop-blur ${isCancelled ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base">{reservation.resource.name}</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider mt-1">
              {reservation.resource.type}
            </CardDescription>
          </div>
          <Badge variant={isCancelled ? 'secondary' : 'default'}>{reservation.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-2 pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{formatOrgDate(reservation.startTime, tz, 'EEE, MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {formatOrgDate(reservation.startTime, tz, 'h:mm a')}
            {' – '}
            {formatOrgDate(reservation.endTime, tz, 'h:mm a')}
          </span>
        </div>
        {reservation.notes && (
          <p className="text-sm border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
            {reservation.notes}
          </p>
        )}
      </CardContent>

      {!isCancelled && (
        <CardFooter className="pt-2 border-t border-border/30">
          <ConfirmDialog
            title="Cancel this booking?"
            description="This will free up the slot for others. This cannot be undone."
            onConfirm={onCancel}
          >
            <Button variant="destructive" size="sm" className="w-full text-xs" disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </ConfirmDialog>
        </CardFooter>
      )}
    </Card>
  );
}

function ReservationGrid({ reservations, isLoading, error, refetch, timezone }) {
  const queryClient = useQueryClient();

  const cancel = useMutation({
    mutationFn: (id) => apiClient(`/api/v1/reservations/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      toast('Booking cancelled');
    },
    onError: () => toast.error('Failed to cancel booking'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!reservations.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No bookings here"
        description="Nothing to show for this filter."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reservations.map((r) => (
        <ReservationCard
          key={r.id}
          reservation={r}
          onCancel={() => cancel.mutate(r.id)}
          cancelling={cancel.isPending}
          timezone={timezone}
        />
      ))}
    </div>
  );
}

export default function ReservationsPage() {
  const { user, organization } = useAuth();
  const timezone = organization?.timezone || 'UTC';

  const endpoint = user?.role === 'ADMIN'
    ? '/api/v1/reservations'
    : '/api/v1/reservations/mine';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: () => apiClient(endpoint),
    enabled: !!user,
  });

  const all = data?.data ?? [];
  const upcoming = all.filter((r) => r.status === 'CONFIRMED' && new Date(r.endTime) >= new Date());
  const past = all.filter((r) => r.status !== 'CONFIRMED' || new Date(r.endTime) < new Date());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="My Reservations"
        description="Track and manage all your bookings."
      />

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past &amp; Cancelled ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <ReservationGrid
            reservations={upcoming}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
            timezone={timezone}
          />
        </TabsContent>

        <TabsContent value="past">
          <ReservationGrid
            reservations={past}
            isLoading={isLoading}
            error={error}
            refetch={refetch}
            timezone={timezone}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
