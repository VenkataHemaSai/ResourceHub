import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatOrgDate } from '@/api/dates';
import { getErrorMessage } from '@/api/errorMessages';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Clock, BookOpen, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_VARIANTS = {
  PENDING_ALLOCATION: 'outline',
  ALLOCATED: 'default',
  RETURNED: 'secondary',
  CANCELLED: 'secondary',
  NO_SHOW: 'destructive',
};

const STATUS_LABELS = {
  PENDING_ALLOCATION: 'Awaiting Allocation',
  ALLOCATED: 'Allocated — In Use',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const UPCOMING_STATUSES = ['PENDING_ALLOCATION', 'ALLOCATED'];

function BanAlert({ bans }) {
  if (!bans?.length) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
      <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-destructive">Active Suspension{bans.length > 1 ? 's' : ''}</p>
        {bans.map((ban) => (
          <p key={`${ban.userId}-${ban.resourceType}`} className="text-sm text-muted-foreground">
            You are suspended from booking <strong>{ban.resourceType}</strong> resources until{' '}
            <strong>{new Date(ban.bannedUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.{' '}
            Reason: {ban.reason}
          </p>
        ))}
      </div>
    </div>
  );
}

function ReservationCard({ reservation, onCancel, cancelling, timezone }) {
  const tz = timezone || 'UTC';
  const canCancel = reservation.status === 'PENDING_ALLOCATION';
  const isOver = ['RETURNED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status);

  return (
    <Card className={`flex flex-col border-border/50 bg-card/50 backdrop-blur transition-all ${isOver ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base">{reservation.resource.name}</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider mt-1">
              {reservation.resource.type}
            </CardDescription>
          </div>
          <Badge variant={STATUS_VARIANTS[reservation.status] ?? 'outline'} className="text-xs shrink-0">
            {STATUS_LABELS[reservation.status] ?? reservation.status}
          </Badge>
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
        {reservation.status === 'ALLOCATED' && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Please return on time
          </div>
        )}
      </CardContent>

      {canCancel && (
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
    onError: (err) => toast.error(getErrorMessage(err.code) || 'Failed to cancel booking'),
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
  const now = new Date();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: () => apiClient('/api/v1/reservations/mine'),
    enabled: !!user,
  });

  const { data: bansData } = useQuery({
    queryKey: ['bans', 'mine'],
    queryFn: () => apiClient('/api/v1/users/bans/me'),
    enabled: !!user,
  });

  const all = data?.data ?? [];
  const myBans = bansData?.data ?? [];

  const upcoming = all.filter(
    (r) => UPCOMING_STATUSES.includes(r.status) && new Date(r.endTime) >= now
  );
  const past = all.filter(
    (r) => !UPCOMING_STATUSES.includes(r.status) || new Date(r.endTime) < now
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="My Reservations"
        description="Track and manage all your bookings."
      />

      <BanAlert bans={myBans} />

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
