import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkspaceHeader({ title, subtitle, backTo, backLabel = 'Back to dashboard', sticky, children }) {
  return (
    <header className={`workspace-bar ${sticky ? 'sticky top-0 z-10' : ''}`}>
      <div className="app-wrap workspace-bar-inner">
        <div className="workspace-bar-title">
          {backTo && (
            <Link className="workspace-back" to={backTo} aria-label={backLabel}>
              <ArrowLeft aria-hidden="true" size={21} />
            </Link>
          )}
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
