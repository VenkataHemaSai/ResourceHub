import { useState } from 'react';
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
import { PaginationControl } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReservationsPage() {
  const { organization } = useAuth();
  const timezone = organization?.timezone || 'UTC';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const queryParams = new URLSearchParams({ page, limit: 20 });
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-reservations', page, statusFilter],
    queryFn: () => apiClient(`/api/v1/reservations?${queryParams}`),
  });

  const cancel = useMutation({
    mutationFn: (id) => apiClient(`/api/v1/reservations/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast('Reservation cancelled');
    },
    onError: (err) => toast.error(getErrorMessage(err.code)),
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                    <TableHead className="text-right">Action</TableHead>
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
                      <TableCell>{r.user?.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOrgDate(r.startTime, timezone, 'EEE, MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOrgDate(r.startTime, timezone, 'h:mm a')}
                        {' – '}
                        {formatOrgDate(r.endTime, timezone, 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === 'CONFIRMED' && (
                          <ConfirmDialog
                            title="Cancel this booking?"
                            description={`This will cancel ${r.user?.name ?? 'this user'}'s booking for ${r.resource.name}. This cannot be undone.`}
                            onConfirm={() => cancel.mutate(r.id)}
                          >
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={cancel.isPending}
                            >
                              Cancel
                            </Button>
                          </ConfirmDialog>
                        )}
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
    </div>
  );
}
