import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { Button, EmptyState } from '@/components/ui';
import { CURRICULUM_ROOT } from '@/features/curriculum';
import { DEFAULT_MODULE_ID } from '@/modules/registry';

/**
 * What every curriculum route renders when its ids do not resolve.
 *
 * One component so a hand-typed or stale URL behaves the same at every depth.
 */
export function CurriculumMissing({ what }: { what: string }) {
  const navigate = useNavigate();

  return (
    <AppShell title="Curriculum" subtitle="Nothing here" activeModuleId={DEFAULT_MODULE_ID}>
      <EmptyState
        icon="layers"
        title={`That ${what} does not exist`}
        description="The link may be out of date, or the code may have a typo."
        action={
          <Button variant="primary" icon="layers" onClick={() => navigate(CURRICULUM_ROOT)}>
            Back to curriculum
          </Button>
        }
      />
    </AppShell>
  );
}
