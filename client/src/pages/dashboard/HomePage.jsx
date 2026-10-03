import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/errorMessages';
import { setFormErrors } from '@/api/form';
import { formatOrgDate } from '@/api/dates';

import { CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Calendar, Clock, Plus, BookOpen, Layers,
  ClockAlert, ShieldAlert, CheckCircle2, ArrowRight,
} from 'lucide-react';

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const bookResourceSchema = z.object({
  resourceId: z.string().min(1, 'Please select a resource'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
});

function BookResourceDialog({ children, resources = [] }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(bookResourceSchema),
    defaultValues: { resourceId: '', startTime: '', endTime: '', notes: '' },
  });

  const createReservation = useMutation({
    mutationFn: (data) => {
      const start = new Date(data.startTime).toISOString();
      const end = new Date(data.endTime).toISOString();
      return apiClient('/api/v1/reservations', { body: { ...data, startTime: start, endTime: end } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      setOpen(false);
      form.reset();
      setServerError(null);
      toast('Booking submitted — waiting for allocation');
    },
    onError: (err) => {
      if (err.code === 'SLOT_TAKEN') {
        queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
        setServerError(getErrorMessage('SLOT_TAKEN'));
      } else if (err.fields) {
        setFormErrors(err.fields, form);
      } else {
        setServerError(getErrorMessage(err.code) || err.message);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setServerError(null); form.reset(); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a Resource</DialogTitle>
          <DialogDescription>Select a resource and time slot.</DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium">
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { setServerError(null); createReservation.mutate(v); })} className="space-y-4">
            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resources.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Purpose of booking..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createReservation.isPending}>
                {createReservation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, icon: Icon, variant = 'default', href }) {
  const colorMap = {
    default: 'text-foreground',
    warning: 'text-amber-500',
    danger: 'text-destructive',
    success: 'text-green-500',
  };

  const content = (
    <Card className={`transition-all ${href ? 'hover:border-primary/40 cursor-pointer' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-5 w-5 ${colorMap[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorMap[variant]}`}>{value ?? '—'}</div>
      </CardContent>
    </Card>
  );

  if (href) return <Link to={href}>{content}</Link>;
  return content;
}

function AdminDashboard({ user }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient('/api/v1/dashboard/stats'),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's your organization overview.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pending Allocation"
            value={stats?.pendingAllocations}
            icon={ClockAlert}
            variant={stats?.pendingAllocations > 0 ? 'warning' : 'default'}
            href="/dashboard/admin/reservations"
          />
          <StatCard
            label="Currently In Use"
            value={stats?.allocated}
            icon={CheckCircle2}
            variant="success"
            href="/dashboard/admin/reservations"
          />
          <StatCard
            label="Overdue Returns"
            value={stats?.overdue}
            icon={BookOpen}
            variant={stats?.overdue > 0 ? 'danger' : 'default'}
            href="/dashboard/admin/reservations"
          />
          <StatCard
            label="Active Resources"
            value={stats?.activeResources}
            icon={Layers}
            href="/dashboard/resources"
          />
          <StatCard
            label="Active Suspensions"
            value={stats?.activeSuspensions}
            icon={ShieldAlert}
            variant={stats?.activeSuspensions > 0 ? 'danger' : 'default'}
            href="/dashboard/admin/bans"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/dashboard/admin/reservations">
                Manage Bookings <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/dashboard/resources">
                Manage Resources <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/dashboard/team">
                Manage Members <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/dashboard/admin/bans">
                View Suspensions <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberReservationCard({ reservation, timezone }) {
  const queryClient = useQueryClient();
  const tz = timezone || 'UTC';

  const cancelStatus = useMutation({
    mutationFn: () => apiClient(`/api/v1/reservations/${reservation.id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      toast('Reservation cancelled');
    },
  });

  const canCancel = reservation.status === 'PENDING_ALLOCATION';

  return (
    <Card className={`flex flex-col overflow-hidden transition-all bg-background/50 backdrop-blur border-border/50`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold">{reservation.resource.name}</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium mt-1">
              {reservation.resource.type}
            </CardDescription>
          </div>
          <Badge variant={reservation.status === 'ALLOCATED' ? 'default' : 'outline'} className="text-xs shrink-0">
            {reservation.status === 'PENDING_ALLOCATION' ? 'Awaiting Allocation' : 'Allocated'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Calendar className="w-4 h-4" />
          <span>{formatOrgDate(reservation.startTime, tz, 'EEE, MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="w-4 h-4" />
          <span>
            {formatOrgDate(reservation.startTime, tz, 'h:mm a')} – {formatOrgDate(reservation.endTime, tz, 'h:mm a')}
          </span>
        </div>
      </CardContent>
      {canCancel && (
        <CardFooter className="pt-2 border-t border-border/30 bg-muted/20">
          <Button
            variant="destructive"
            size="sm"
            className="w-full text-xs"
            onClick={() => cancelStatus.mutate()}
            disabled={cancelStatus.isPending}
          >
            {cancelStatus.isPending ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function MemberDashboard({ user, organization }) {
  const timezone = organization?.timezone || 'UTC';
  const now = new Date();

  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: () => apiClient('/api/v1/reservations/mine'),
    enabled: !!user?.id,
  });

  const { data: resourceData } = useQuery({
    queryKey: ['resources', 'active'],
    queryFn: () => apiClient('/api/v1/resources?isActive=true&limit=100'),
  });

  const upcoming = (resData?.data || [])
    .filter((r) => ['PENDING_ALLOCATION', 'ALLOCATED'].includes(r.status) && new Date(r.endTime) >= now)
    .slice(0, 3);

  const resources = resourceData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}.</p>
        </div>
        <BookResourceDialog resources={resources}>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Book a Resource
          </Button>
        </BookResourceDialog>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
          <Link to="/dashboard/reservations" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {resLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton /><CardSkeleton />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming bookings"
            description="You don't have any resources booked right now."
            action={
              <BookResourceDialog resources={resources}>
                <Button variant="outline" className="mt-4">Book Now</Button>
              </BookResourceDialog>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((res) => (
              <MemberReservationCard key={res.id} reservation={res} timezone={timezone} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, organization } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (isAdmin) return <AdminDashboard user={user} />;
  return <MemberDashboard user={user} organization={organization} />;
}
