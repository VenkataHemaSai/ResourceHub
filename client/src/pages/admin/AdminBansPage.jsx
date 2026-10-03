import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { getErrorMessage } from '@/api/errorMessages';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBansPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-bans'],
    queryFn: () => apiClient('/api/v1/users/bans/list'),
  });

  const unban = useMutation({
    mutationFn: ({ userId, resourceType }) =>
      apiClient(`/api/v1/users/bans/${userId}/${encodeURIComponent(resourceType)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bans'] });
      toast.success('Suspension lifted successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err.code) || err.message),
  });

  const bans = data?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Suspended Users"
        description="Members currently suspended from booking specific resource types."
      />

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : bans.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No active suspensions"
          description="All members are in good standing."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Resource Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Suspended Until</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bans.map((ban) => {
                    const isExpired = new Date(ban.bannedUntil) <= new Date();
                    return (
                      <TableRow key={ban.id} className={isExpired ? 'opacity-50' : ''}>
                        <TableCell>
                          <div className="font-medium">{ban.user.name}</div>
                          <div className="text-xs text-muted-foreground">{ban.user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {ban.resourceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-muted-foreground line-clamp-2">{ban.reason}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(ban.bannedUntil).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ban.bannedBy?.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            disabled={unban.isPending}
                            onClick={() =>
                              unban.mutate({ userId: ban.user.id, resourceType: ban.resourceType })
                            }
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            Lift Suspension
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
