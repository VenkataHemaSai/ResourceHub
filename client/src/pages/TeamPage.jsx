import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { getErrorMessage } from '@/lib/errorMessages';
import { setFormErrors } from '@/lib/form';

import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingState';
import { PaginationControl } from '@/components/shared/Pagination';
import { Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const addMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Temporary password must be at least 8 characters'),
});

function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const createMember = useMutation({
    mutationFn: (data) => apiClient('/api/v1/users', { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      form.reset();
      toast('Member added successfully');
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
    createMember.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Team Member</DialogTitle>
          <DialogDescription>
            Create an account for a new member in your organization.
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
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="At least 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createMember.isPending}>
                {createMember.isPending ? 'Saving...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamPage() {
  const [page, setPage] = useState(1);
  const { organization } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', page],
    queryFn: () => apiClient(`/api/v1/users?page=${page}&limit=10`),
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Directory" 
        description={`Manage members of ${organization?.name || 'your organization'}`}
      >
        <AddMemberDialog />
      </PageHeader>

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data?.data?.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No members yet" 
          description="Add your first team member to start collaborating."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControl 
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
