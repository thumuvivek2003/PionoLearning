import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { Button, Card, EmptyState } from '@/components/ui';
import { DEFAULT_MODULE_ID } from '@/modules/registry';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppShell title="Not found" activeModuleId={DEFAULT_MODULE_ID}>
      <Card bare>
        <EmptyState
          icon="about"
          title="That page does not exist"
          description="The trainer you were looking for may have been renamed."
          action={
            <Button variant="primary" onClick={() => navigate(`/train/${DEFAULT_MODULE_ID}`)}>
              Back to the trainer
            </Button>
          }
        />
      </Card>
    </AppShell>
  );
}
