import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/errorMessages';
import { setFormErrors } from '@/api/form';

import { CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, Clock, Plus, XCircle, CheckCircle2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      // Ensure ISO string with current timezone offset
      const start = new Date(data.startTime).toISOString();
      const end = new Date(data.endTime).toISOString();
      return apiClient('/api/v1/reservations', {
        body: { ...data, startTime: start, endTime: end }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setOpen(false);
      form.reset();
      toast('Reservation confirmed!');
    },
    onError: (err) => {
      if (err.fields) {
        setFormErrors(err.fields, form);
      } else {
        setServerError(getErrorMessage(err.code) || err.message);
      }
    }
  });

  const onSubmit = (values) => {
    setServerError(null);
    createReservation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a Resource</DialogTitle>
          <DialogDescription>
            Select a resource and time slot.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium">
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {resources.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({r.type})</SelectItem>
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
            <div className="flex justify-end pt-4">
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

function ReservationCard({ reservation }) {
  const queryClient = useQueryClient();

  const cancelStatus = useMutation({
    mutationFn: () => apiClient(`/api/v1/reservations/${reservation.id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast('Reservation cancelled');
    }
  });

  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);
  const isCancelled = reservation.status === 'CANCELLED';

  return (
    <Card className={`flex flex-col overflow-hidden transition-all bg-background/50 backdrop-blur border-border/50 ${isCancelled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold">{reservation.resource.name}</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium mt-1">
              {reservation.resource.type}
            </CardDescription>
          </div>
          <Badge variant={isCancelled ? "secondary" : "default"}>
            {reservation.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Calendar className="w-4 h-4" />
          <span>{start.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="w-4 h-4" />
          <span>
            {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        {reservation.notes && (
          <p className="mt-3 text-sm italic border-l-2 border-primary/50 pl-2">
            "{reservation.notes}"
          </p>
        )}
      </CardContent>
      
      {!isCancelled && (
        <CardFooter className="pt-2 border-t border-border/30 bg-muted/20">
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full text-xs" 
            onClick={() => cancelStatus.mutate()}
            disabled={cancelStatus.isPending}
          >
            Cancel Booking
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  // Fetch user's upcoming reservations
  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['reservations', { userId: user?.id }],
    queryFn: () => apiClient(`/api/v1/reservations?userId=${user.id}`),
    enabled: !!user?.id
  });

  // Fetch active resources for the booking modal
  const { data: resourceData } = useQuery({
    queryKey: ['resources', 'active'],
    queryFn: () => apiClient('/api/v1/resources?isActive=true&limit=100'),
  });

  const reservations = resData?.data || [];
  const resources = resourceData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}. Here is your schedule.
          </p>
        </div>
        <BookResourceDialog resources={resources}>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Book a Resource
          </Button>
        </BookResourceDialog>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Bookings</h2>
        
        {resLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : reservations.length === 0 ? (
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
            {reservations.map(res => (
              <ReservationCard key={res.id} reservation={res} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
