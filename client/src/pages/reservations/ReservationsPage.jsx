import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function ReservationCard({ reservation }) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => apiClient(`/api/v1/reservations/${reservation.id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast('Reservation cancelled');
    },
  });

  const isConfirmed = reservation.status === 'CONFIRMED';
  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:border-primary/50 bg-background/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{reservation.resource?.name}</CardTitle>
          <CardDescription className="text-xs uppercase tracking-wider font-medium mt-1">
            {reservation.resource?.type}
          </CardDescription>
        </div>
        <Badge variant={isConfirmed ? 'default' : 'secondary'} className="font-medium shadow-none shrink-0">
          {reservation.status}
        </Badge>
      </CardHeader>

      <CardContent className="flex-grow pt-2 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{start.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' — '}
            {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {reservation.notes && (
          <p className="text-sm italic border-l-2 border-primary/50 pl-2 text-muted-foreground">
            "{reservation.notes}"
          </p>
        )}
      </CardContent>

      {isConfirmed && (
        <CardFooter className="pt-4 border-t border-border/30 bg-muted/20">
          <Button
            variant="destructive"
            size="sm"
            className="w-full text-xs"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Reservation'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reservations', { scope: isAdmin ? 'all' : user?.id }],
    queryFn: () =>
      isAdmin
        ? apiClient('/api/v1/reservations')
        : apiClient(`/api/v1/reservations?userId=${user.id}`),
    enabled: !!user?.id,
  });

  const reservations = data?.data ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reservations</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "All reservations across your organization" : "Your upcoming and past bookings"}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No reservations found"
          description={isAdmin ? "No reservations have been made yet." : "You haven't booked anything yet. Head to the Dashboard to make a booking."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
    </div>
  );
}
