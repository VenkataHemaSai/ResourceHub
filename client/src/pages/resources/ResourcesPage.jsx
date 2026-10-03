import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';;
import * as z from 'zod';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/errorMessages';
import { setFormErrors } from '@/api/form';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { PaginationControl } from '@/components/shared/Pagination';
import { Box, Plus, MoreVertical, Pencil, Image as ImageIcon, Layers, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const resourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(2, 'Type is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Must be at least 1').default(1),
  minDurationMinutes: z.coerce.number().int().min(5).default(15),
  maxDurationMinutes: z.coerce.number().int().min(5).default(240),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').default('09:00'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').default('17:00'),
});

function ImageUploadField({ value, onChange }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-full h-40 rounded-lg border-2 border-dashed border-border/50 overflow-hidden cursor-pointer bg-muted/20 hover:border-primary/40 transition-colors flex items-center justify-center"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm">Click to upload image (max 2MB)</span>
          </div>
        )}
        {value && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">Change photo</span>
          </div>
        )}
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive text-xs"
          onClick={() => onChange('')}
        >
          Remove photo
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function ResourceFormFields({ form }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Photo</FormLabel>
            <FormControl>
              <ImageUploadField value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Name</FormLabel>
              <FormControl>
                <Input placeholder="GPU Server Node 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input placeholder="GPU, Camera, Laptop…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Details about this resource…" rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock / Quantity</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minDurationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Duration (min)</FormLabel>
              <FormControl>
                <Input type="number" min={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxDurationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Duration (min)</FormLabel>
              <FormControl>
                <Input type="number" min={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="openTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opens At</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="closeTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closes At</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function CreateResourceDialog({ children }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
      imageUrl: '',
      quantity: 1,
      minDurationMinutes: 15,
      maxDurationMinutes: 240,
      openTime: '09:00',
      closeTime: '17:00',
    },
  });

  const createResource = useMutation({
    mutationFn: (data) => apiClient('/api/v1/resources', { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setOpen(false);
      form.reset();
      setServerError(null);
      toast('Resource created successfully');
    },
    onError: (err) => {
      if (err.fields) setFormErrors(err.fields, form);
      else setServerError(getErrorMessage(err.code) || err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setServerError(null); form.reset(); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Resource</DialogTitle>
          <DialogDescription>Create a new resource for your organization.</DialogDescription>
        </DialogHeader>
        {serverError && (
          <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium">
            {serverError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { setServerError(null); createResource.mutate(v); })}>
            <ResourceFormFields form={form} />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createResource.isPending}>
                {createResource.isPending ? 'Saving...' : 'Create Resource'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditResourceDialog({ resource, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: resource.name,
      type: resource.type,
      description: resource.description ?? '',
      imageUrl: resource.imageUrl ?? '',
      quantity: resource.quantity ?? 1,
      minDurationMinutes: resource.minDurationMinutes ?? 15,
      maxDurationMinutes: resource.maxDurationMinutes ?? 240,
      openTime: resource.openTime ?? '09:00',
      closeTime: resource.closeTime ?? '17:00',
    },
  });

  const updateResource = useMutation({
    mutationFn: (data) =>
      apiClient(`/api/v1/resources/${resource.id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', resource.id] });
      setServerError(null);
      onOpenChange(false);
      toast('Resource updated');
    },
    onError: (err) => {
      if (err.fields) setFormErrors(err.fields, form);
      else setServerError(getErrorMessage(err.code) || err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setServerError(null); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update the details for {resource.name}.</DialogDescription>
        </DialogHeader>
        {serverError && (
          <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md font-medium">
            {serverError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { setServerError(null); updateResource.mutate(v); })}>
            <ResourceFormFields form={form} />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateResource.isPending}>
                {updateResource.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ResourceCard({ resource, isAdmin }) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const toggleStatus = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/resources/${resource.id}/${resource.isActive ? 'deactivate' : 'reactivate'}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast(resource.isActive ? 'Resource deactivated' : 'Resource reactivated');
    },
    onError: (err) => toast.error(getErrorMessage(err.code)),
  });

  return (
    <>
      <div className={`group flex flex-col rounded-xl border border-border/50 bg-background/50 backdrop-blur overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${!resource.isActive ? 'opacity-60' : ''}`}>
        <div className="relative h-44 bg-muted overflow-hidden">
          {resource.imageUrl ? (
            <img
              src={resource.imageUrl}
              alt={resource.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Box className="h-12 w-12 text-primary/20" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className="text-xs font-semibold shadow-md bg-background/80 text-foreground backdrop-blur border-border/50">
              {resource.type}
            </Badge>
            {!resource.isActive && (
              <Badge variant="secondary" className="text-xs shadow-md bg-background/80 backdrop-blur">
                Inactive
              </Badge>
            )}
          </div>

          {isAdmin && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/70 backdrop-blur hover:bg-background"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toggleStatus.mutate()}
                    className={resource.isActive ? 'text-destructive focus:text-destructive' : ''}
                  >
                    {resource.isActive ? 'Deactivate' : 'Reactivate'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4 gap-3">
          <div>
            <h3 className="font-semibold text-base text-foreground leading-snug">{resource.name}</h3>
            {resource.description ? (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground/40 italic mt-1">No description.</p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {resource.quantity} unit{resource.quantity !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {resource.openTime}–{resource.closeTime}
            </span>
          </div>

          <Button asChild className="w-full mt-1" variant={resource.isActive ? 'default' : 'secondary'} disabled={!resource.isActive}>
            <Link to={`/dashboard/resources/${resource.id}`}>
              {resource.isActive ? 'View & Book' : 'View Details'}
            </Link>
          </Button>
        </div>
      </div>

      {isAdmin && (
        <EditResourceDialog resource={resource} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </>
  );
}

export default function ResourcesPage() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['resources', page],
    queryFn: () => apiClient(`/api/v1/resources?page=${page}&limit=12`),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Resources</h1>
          <p className="text-muted-foreground mt-1">Browse and book your organization's assets</p>
        </div>
        {isAdmin && (
          <CreateResourceDialog>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          </CreateResourceDialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No resources found"
          description={
            isAdmin
              ? 'Create your first resource to get started.'
              : "Your organization hasn't added any resources yet."
          }
          action={
            isAdmin ? (
              <CreateResourceDialog>
                <Button variant="outline" className="mt-4">Create Resource</Button>
              </CreateResourceDialog>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} isAdmin={isAdmin} />
            ))}
          </div>
          {data.meta.totalPages > 1 && (
            <PaginationControl
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
