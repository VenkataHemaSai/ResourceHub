import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/api/errorMessages';
import { setFormErrors } from '@/api/form';

import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { PaginationControl } from '@/components/shared/Pagination';
import { Box, Laptop, DoorOpen, Plus, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const resourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(2, 'Type is required'),
  description: z.string().optional(),
});

function ResourceFormDialog({ children }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: { name: '', type: 'ROOM', description: '' },
  });

  const createResource = useMutation({
    mutationFn: (data) => apiClient('/api/v1/resources', { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setOpen(false);
      form.reset();
      toast('Resource created successfully');
    },
    onError: (err) => {
      if (err.fields) {
        setFormErrors(err.fields, form);
      } else {
        setServerError(getErrorMessage(err.code));
      }
    }
  });

  const onSubmit = (values) => {
    setServerError(null);
    createResource.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Resource</DialogTitle>
          <DialogDescription>
            Create a new room or equipment for your organization to use.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Conference Room A" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ROOM">Room</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="VEHICLE">Vehicle</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about this resource..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

function ResourceCard({ resource, isAdmin }) {
  const queryClient = useQueryClient();

  const toggleStatus = useMutation({
    mutationFn: () => apiClient(`/api/v1/resources/${resource.id}/${resource.isActive ? 'deactivate' : 'reactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast(resource.isActive ? 'Resource deactivated' : 'Resource reactivated');
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'ROOM': return <DoorOpen className="h-5 w-5" />;
      case 'EQUIPMENT': return <Laptop className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:border-primary/50 bg-background/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            {getIcon(resource.type)}
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{resource.name}</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium mt-1">
              {resource.type}
            </CardDescription>
          </div>
        </div>
        
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => toggleStatus.mutate()}
                className={resource.isActive ? "text-destructive focus:text-destructive" : ""}
              >
                {resource.isActive ? 'Deactivate' : 'Reactivate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow pt-4">
        {resource.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {resource.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            No description provided.
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-4 border-t border-border/30 bg-muted/20 flex justify-between items-center">
        <Badge variant={resource.isActive ? "default" : "secondary"} className="font-medium shadow-none">
          {resource.isActive ? (
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
          )}
        </Badge>
        <span className="text-xs text-muted-foreground font-medium">
          Added {new Date(resource.createdAt).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
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
          <p className="text-muted-foreground mt-1">
            Browse and manage your organization's assets
          </p>
        </div>
        {isAdmin && (
          <ResourceFormDialog>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          </ResourceFormDialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data?.data?.length === 0 ? (
        <EmptyState 
          icon={Box}
          title="No resources found" 
          description={isAdmin ? "Create your first resource to get started." : "Your organization hasn't added any resources yet."}
          action={isAdmin ? (
            <ResourceFormDialog>
              <Button variant="outline" className="mt-4">Create Resource</Button>
            </ResourceFormDialog>
          ) : undefined}
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
