import { ArrowUpRight, ClipboardList, Clock3, ListChecks } from 'lucide-react';
import AppBrand from '../UI/AppBrand';

const practiceSteps = [
  { icon: ClipboardList, title: 'Build a quiz', description: 'Import your own questions from a CSV.' },
  { icon: Clock3, title: 'Practise under a timer', description: 'Set your time limit before you start.' },
  { icon: ListChecks, title: 'Review each attempt', description: 'See which questions you got right or missed.' },
];

export default function AuthLayout({ title, description, children }) {
  return (
    <div className="app-night auth-page">
      <header className="app-wrap app-topbar glass-panel">
        <AppBrand />
        <a className="app-button app-button-outline" href="/#study-guide">
          Study guide <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </header>
      <main className="app-wrap auth-grid">
        <aside className="auth-intro" aria-label="About NSCT PrepHub">
          <p className="auth-intro-title">Build and review <span>timed quizzes.</span></p>
          <ul className="auth-steps glass-panel">
            {practiceSteps.map(({ icon: Icon, title: stepTitle, description: stepDescription }) => (
              <li key={stepTitle}>
                <span className="app-icon"><Icon aria-hidden="true" size={20} /></span>
                <div><strong>{stepTitle}</strong><p>{stepDescription}</p></div>
              </li>
            ))}
          </ul>
        </aside>
        <section className="auth-card glass-panel" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </section>
      </main>
    </div>
  );
}
