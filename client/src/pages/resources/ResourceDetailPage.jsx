import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/errorMessages';
import { setFormErrors } from '@/api/form';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const bookingSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
});

function toLocalDatetimeString(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BookingDialog({ open, onOpenChange, resourceId, prefillStart, prefillEnd, onBooked }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startTime: toLocalDatetimeString(prefillStart),
      endTime: toLocalDatetimeString(prefillEnd),
      notes: '',
    },
  });

  const createReservation = useMutation({
    mutationFn: (data) =>
      apiClient('/api/v1/reservations', {
        body: {
          resourceId,
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString(),
          notes: data.notes || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', resourceId] });
      setServerError(null);
      form.reset();
      onOpenChange(false);
      onBooked?.();
      toast('Reservation confirmed!');
    },
    onError: (err) => {
      if (err.code === 'SLOT_TAKEN') {
        queryClient.invalidateQueries({ queryKey: ['reservations', resourceId] });
        setServerError(getErrorMessage('SLOT_TAKEN'));
      } else if (err.fields) {
        setFormErrors(err.fields, form);
      } else {
        setServerError(getErrorMessage(err.code) || err.message);
      }
    },
  });

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setServerError(null);
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book this Resource</DialogTitle>
          <DialogDescription>Choose a start and end time for your reservation.</DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium">
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { setServerError(null); createReservation.mutate(v); })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
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

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { organization } = useAuth();

  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date()).toISOString(),
    to: new Date(startOfWeek(new Date()).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const [bookingDialog, setBookingDialog] = useState({ open: false, start: null, end: null });

  const { data: resource, isLoading: resLoading, error: resError } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => apiClient(`/api/v1/resources/${id}`),
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', id, dateRange],
    queryFn: () => apiClient(`/api/v1/resources/${id}/reservations?from=${dateRange.from}&to=${dateRange.to}`),
    enabled: !!id,
  });

  const events = useMemo(() => {
    if (!reservations?.data) return [];
    return reservations.data.map((r) => ({
      id: r.id,
      title: r.user?.name || 'Booked',
      start: new Date(r.startTime),
      end: new Date(r.endTime),
    }));
  }, [reservations]);

  const handleRangeChange = (range) => {
    if (Array.isArray(range)) {
      if (range.length > 0) {
        setDateRange({
          from: range[0].toISOString(),
          to: new Date(range[range.length - 1].getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } else if (range.start && range.end) {
      setDateRange({ from: range.start.toISOString(), to: range.end.toISOString() });
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    setBookingDialog({ open: true, start: start.toISOString(), end: end.toISOString() });
  };

  if (resLoading) return <CardSkeleton />;
  if (resError) return <ErrorState error={resError} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/dashboard/resources">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Resources
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title={resource.name}
            description={`${resource.type} • ${resource.isActive ? 'Active' : 'Inactive'}`}
          />
          {resource.isActive && (
            <Button
              className="gap-2 shrink-0"
              onClick={() => setBookingDialog({ open: true, start: null, end: null })}
            >
              <Plus className="h-4 w-4" /> Book this Resource
            </Button>
          )}
        </div>
        {resource.description && (
          <p className="text-muted-foreground text-sm mt-2">{resource.description}</p>
        )}
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-4 h-[600px] overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          .rbc-calendar { font-family: inherit; }
          .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-header, .dark .rbc-day-bg, .dark .rbc-time-content, .dark .rbc-timeslot-group, .dark .rbc-time-header-content { border-color: hsl(var(--border)); }
          .dark .rbc-off-range-bg { background: hsl(var(--muted) / 0.3); }
          .dark .rbc-today { background: hsl(var(--muted) / 0.5); }
          .dark .rbc-event { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
          .dark .rbc-toolbar button { color: hsl(var(--foreground)); border-color: hsl(var(--border)); }
          .dark .rbc-toolbar button:active, .dark .rbc-toolbar button.rbc-active { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-color: hsl(var(--primary)); }
          .rbc-slot-selection { background: hsl(var(--primary) / 0.15); border: 1px solid hsl(var(--primary) / 0.4); }
        `}} />
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="week"
          views={['month', 'week', 'day']}
          onRangeChange={handleRangeChange}
          selectable={resource.isActive}
          onSelectSlot={handleSelectSlot}
          className="w-full h-full"
        />
      </div>

      <BookingDialog
        open={bookingDialog.open}
        onOpenChange={(open) => setBookingDialog((prev) => ({ ...prev, open }))}
        resourceId={id}
        prefillStart={bookingDialog.start}
        prefillEnd={bookingDialog.end}
        onBooked={() => {}}
      />
    </div>
  );
}
