import { Button } from '@/components/ui/button';
import { LoadingState, CardSkeleton } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PaginationControl } from '@/components/shared/Pagination';
import { DemoForm } from '@/components/shared/DemoForm';
import { Inbox } from 'lucide-react';

export default function UiShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 lg:p-16">
      <div className="max-w-4xl mx-auto space-y-16">
        
        <PageHeader 
          title="UI Showcase" 
          description="A developer playground to verify shadcn/ui components and theme tokens."
        >
          <Button variant="outline">Docs</Button>
          <Button>Deploy</Button>
        </PageHeader>

        <section className="space-y-4">
          <div className="border-b pb-2 border-border/50">
            <h2 className="text-xl font-semibold">Buttons</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b pb-2 border-border/50">
            <h2 className="text-xl font-semibold">Shared States</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Loading State</h3>
              <div className="border rounded-xl">
                <LoadingState message="Fetching data..." />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Skeletons</h3>
              <CardSkeleton />
            </div>

            <div className="space-y-2 md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Empty State</h3>
              <EmptyState 
                icon={Inbox} 
                title="No resources found" 
                description="There are currently no resources matching your criteria."
                actionLabel="Clear Filters"
                onAction={() => alert('Action clicked')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Error State</h3>
              <ErrorState 
                message="Failed to load the requested data. Please try again."
                onRetry={() => alert('Retry clicked')}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b pb-2 border-border/50">
            <h2 className="text-xl font-semibold">Modals & Pagination</h2>
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-4">
              <ConfirmDialog 
                title="Delete Resource?"
                description="This will permanently delete the resource and all its data."
                variant="destructive"
                confirmText="Delete"
                onConfirm={async () => new Promise(res => setTimeout(res, 1000))}
              >
                <Button variant="destructive">Trigger Destructive Modal</Button>
              </ConfirmDialog>

              <ConfirmDialog 
                title="Publish changes?"
                description="This will make your changes visible to all users."
                onConfirm={async () => new Promise(res => setTimeout(res, 1000))}
              >
                <Button>Trigger Standard Modal</Button>
              </ConfirmDialog>
            </div>

            <div className="border rounded-xl">
              <PaginationControl currentPage={2} totalPages={5} onPageChange={() => {}} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b pb-2 border-border/50">
            <h2 className="text-xl font-semibold">Form Kit & Validation</h2>
          </div>
          <div className="max-w-md">
            <DemoForm />
          </div>
        </section>

      </div>
    </div>
  );
}
