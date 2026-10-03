import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatOrgDate } from '@/api/dates';
import { getErrorMessage } from '@/api/errorMessages';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PaginationControl } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { BookOpen, CheckCircle2, RotateCcw, UserX, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_VARIANTS = {
  PENDING_ALLOCATION: 'outline',
  ALLOCATED: 'default',
  RETURNED: 'secondary',
  CANCELLED: 'secondary',
  NO_SHOW: 'destructive',
};

const STATUS_LABELS = {
  PENDING_ALLOCATION: 'Pending',
  ALLOCATED: 'Allocated',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const returnSchema = z.object({
  adminNotes: z.string().max(1000).optional(),
});

const banSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  bannedUntil: z.string().min(1, 'Select a date'),
});

function ReturnDialog({ reservation, open, onClose, timezone }) {
  const queryClient = useQueryClient();
  const [returnResult, setReturnResult] = useState(null);

  const form = useForm({ resolver: zodResolver(returnSchema), defaultValues: { adminNotes: '' } });
  const banForm = useForm({
    resolver: zodResolver(banSchema),
    defaultValues: {
      reason: '',
      bannedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  });

  const returnMutation = useMutation({
    mutationFn: (data) =>
      apiClient(`/api/v1/reservations/${reservation.id}/return`, { method: 'POST', body: data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      if (!result.isLate) {
        toast.success('Resource marked as returned');
        handleClose();
      } else {
        setReturnResult(result);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err.code) || err.message),
  });

  const banMutation = useMutation({
    mutationFn: (data) =>
      apiClient('/api/v1/users/bans', {
        method: 'POST',
        body: {
          userId: reservation.userId,
          resourceType: reservation.resource.type,
          ...data,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bans'] });
      toast.success(`${reservation.user?.name} has been suspended from booking ${reservation.resource.type}`);
      handleClose();
    },
    onError: (err) => toast.error(getErrorMessage(err.code) || err.message),
  });

  const handleClose = () => {
    setReturnResult(null);
    form.reset();
    banForm.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {returnResult ? 'Late Return — Action Required' : `Return: ${reservation.resource.name}`}
          </DialogTitle>
          <DialogDescription>
            {returnResult
              ? `${reservation.user?.name} returned this after the grace period. You may suspend their booking access.`
              : `Confirm that ${reservation.user?.name ?? 'this user'} has returned the resource.`}
          </DialogDescription>
        </DialogHeader>

        {!returnResult ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => returnMutation.mutate(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Condition of item, damage observed, etc."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={returnMutation.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {returnMutation.isPending ? 'Saving…' : 'Confirm Return'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Returned Late</p>
                <p className="text-muted-foreground mt-0.5">
                  Grace period ended at{' '}
                  {formatOrgDate(returnResult.gracePeriodEnd, timezone, 'h:mm a, MMM d')}
                </p>
              </div>
            </div>

            <Form {...banForm}>
              <form
                onSubmit={banForm.handleSubmit((v) => banMutation.mutate(v))}
                className="space-y-4"
              >
                <FormField
                  control={banForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suspension Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain the reason for this suspension…"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={banForm.control}
                  name="bannedUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suspended Until</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Skip — Don't Ban
                  </Button>
                  <Button type="submit" variant="destructive" disabled={banMutation.isPending}>
                    <UserX className="h-4 w-4 mr-2" />
                    {banMutation.isPending ? 'Suspending…' : 'Suspend User'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminReservationsPage() {
  const { organization } = useAuth();
  const timezone = organization?.timezone || 'UTC';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [returnTarget, setReturnTarget] = useState(null);

  const queryParams = new URLSearchParams({ page, limit: 20 });
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-reservations', page, statusFilter],
    queryFn: () => apiClient(`/api/v1/reservations?${queryParams}`),
  });

  const allocate = useMutation({
    mutationFn: (id) => apiClient(`/api/v1/reservations/${id}/allocate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Resource allocated — user has been notified');
    },
    onError: (err) => toast.error(getErrorMessage(err.code) || err.message),
  });

  const noShow = useMutation({
    mutationFn: (id) => apiClient(`/api/v1/reservations/${id}/no-show`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast('Marked as no-show');
    },
    onError: (err) => toast.error(getErrorMessage(err.code) || err.message),
  });

  const cancel = useMutation({
    mutationFn: (id) => apiClient(`/api/v1/reservations/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast('Reservation cancelled');
    },
    onError: (err) => toast.error(getErrorMessage(err.code) || err.message),
  });

  const reservations = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="All Reservations"
          description="View and manage every booking across your organization."
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING_ALLOCATION">Pending</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No reservations found"
          description="No bookings match the current filter."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.resource.name}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          {r.resource.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{r.user?.name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOrgDate(r.startTime, timezone, 'EEE, MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatOrgDate(r.startTime, timezone, 'h:mm a')}
                        {' – '}
                        {formatOrgDate(r.endTime, timezone, 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[r.status] ?? 'outline'}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'PENDING_ALLOCATION' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs"
                                disabled={allocate.isPending}
                                onClick={() => allocate.mutate(r.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Allocate
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-xs text-muted-foreground"
                                disabled={noShow.isPending}
                                onClick={() => noShow.mutate(r.id)}
                              >
                                No Show
                              </Button>
                            </>
                          )}
                          {r.status === 'ALLOCATED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs"
                                onClick={() => setReturnTarget(r)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Return
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-xs text-muted-foreground"
                                disabled={noShow.isPending}
                                onClick={() => noShow.mutate(r.id)}
                              >
                                No Show
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {meta?.totalPages > 1 && (
              <div className="p-4 border-t">
                <PaginationControl
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {returnTarget && (
        <ReturnDialog
          reservation={returnTarget}
          open={!!returnTarget}
          onClose={() => setReturnTarget(null)}
          timezone={timezone}
        />
      )}
    </div>
  );
}
