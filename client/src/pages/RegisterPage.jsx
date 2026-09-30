import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/features/auth/AuthContext';
import { getErrorMessage } from '@/lib/errorMessages';
import { setFormErrors } from '@/lib/form';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  orgName: z.string().min(1, 'Organization name is required.'),
});

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', orgName: '' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await register(values);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.fields) {
        setFormErrors(err.fields, form);
      } else {
        setServerError(getErrorMessage(err.code));
      }
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-lg border-primary/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Register Organization</CardTitle>
        <CardDescription>
          Create a new ResourceHub account for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-6 p-3 bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-md font-medium text-center">
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jane.doe@acme.com" type="email" autoComplete="email" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full mt-6" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
