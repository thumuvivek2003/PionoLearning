import { AppShell } from '@/components/layout';
import { Card } from '@/components/ui';
import { APP_NAME, APP_SUBTITLE, APP_VERSION } from '@/lib/constants';
import { DEFAULT_MODULE_ID, listModules } from '@/modules/registry';
import styles from './pages.module.css';

const PRINCIPLES = [
  'Music theory answers "what notes?" and never touches the UI.',
  'The randomizer answers "which one next?" through swappable strategies.',
  'The piano answers "where is it?" from a highlight map alone.',
  'The session engine owns timing and navigation — nothing else.',
  'Each trainer is a plug-in module registered in one place.',
];

export function AboutPage() {
  const modules = listModules();

  return (
    <AppShell
      title="About"
      subtitle={`${APP_NAME} ${APP_SUBTITLE} v${APP_VERSION}`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <div className={styles.grid2}>
        <Card title="What this is for">
          <div className={styles.prose}>
            <p>
              This is not just a random generator — it is a <strong>keyboard recognition and
              muscle-memory trainer</strong>. You see a note or chord, you find it on the real
              piano, and the on-screen keyboard confirms where it lives relative to the 2–3
              black-key pattern.
            </p>
            <div className={styles.pipeline}>
              <span>Scale / custom set</span>
              <span>↓ random generator</span>
              <span>↓ current item</span>
              <span>↓ piano position</span>
              <span>↓ visual feedback</span>
              <span>↓ you play the real piano</span>
              <span>↓ correct / wrong</span>
              <span>↓ statistics</span>
            </div>
            <p>
              Start at 3 seconds per item in Practice mode. Once the keyboard highlight stops
              telling you anything new, switch to Test mode and grade yourself.
            </p>
          </div>
        </Card>

        <Card title="How it is built">
          <div className={styles.prose}>
            <div className={styles.bullets}>
              {PRINCIPLES.map((line) => (
                <span key={line} className={styles.bullet}>
                  <i className={styles.bulletDot} />
                  <span>{line}</span>
                </span>
              ))}
            </div>

            <h3>Adding a new trainer</h3>
            <div className={styles.pipeline}>
              <span>1. src/modules/&lt;your-module&gt;/index.ts</span>
              <span>2. export const yourModule: TrainerModule = &#123; … &#125;</span>
              <span>3. add it to REGISTERED_MODULES in src/modules/registry.ts</span>
            </div>
            <p>
              Routing, the sidebar, the session engine, the keyboard and the statistics all read
              from that registry, so nothing else has to change.
            </p>

            <h3>Registered trainers</h3>
            <div className={styles.bullets}>
              {modules.map((module) => (
                <span key={module.id} className={styles.bullet}>
                  <i className={styles.bulletDot} />
                  <span>
                    <strong>{module.title}</strong> — {module.description}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Keyboard shortcuts">
        <div className={styles.prose}>
          <div className={styles.bullets}>
            <span className={styles.bullet}>
              <i className={styles.bulletDot} />
              <span>
                <strong>Space</strong> — start, pause or resume
              </span>
            </span>
            <span className={styles.bullet}>
              <i className={styles.bulletDot} />
              <span>
                <strong>← / →</strong> — step back or forward through the sequence
              </span>
            </span>
            <span className={styles.bullet}>
              <i className={styles.bulletDot} />
              <span>
                <strong>1 / 2</strong> — grade correct or wrong in Test mode
              </span>
            </span>
            <span className={styles.bullet}>
              <i className={styles.bulletDot} />
              <span>
                <strong>Esc</strong> — stop and save the session
              </span>
            </span>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
