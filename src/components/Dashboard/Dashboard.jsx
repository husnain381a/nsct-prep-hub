import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, ClipboardList, Clock3, LogOut, PlayCircle, Plus, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AppBrand from '../UI/AppBrand';
import LoadingSpinner from '../UI/LoadingSpinner';

export default function Dashboard({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const userId = user.id;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    async function fetchDashboardData() {
      try {
        const [quizResult, attemptResult] = await Promise.all([
          supabase.from('quizzes').select('*').eq('created_by', userId).order('created_at', { ascending: false }),
          supabase.from('quiz_attempts').select('*, quizzes (title, total_questions)')
            .eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        ]);
        if (!active) return;
        setQuizzes(quizResult.error ? null : quizResult.data ?? []);
        setAttempts(attemptResult.error ? null : attemptResult.data ?? []);
        if (quizResult.error || attemptResult.error) setLoadError('Some practice data could not be loaded.');
      } catch {
        if (active) {
          setQuizzes(null);
          setAttempts(null);
          setLoadError('Your practice data could not be loaded.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { active = false; };
  }, [userId]);

  const handleLogout = async () => {
    setLogoutError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setLogoutError(error.message);
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    }
  };

  const displayName = user.user_metadata?.full_name || user.email;
  const averageScore = attempts?.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : null;
  const metrics = [
    { icon: ClipboardList, label: 'Quizzes created', value: quizzes?.length ?? '—' },
    { icon: Clock3, label: 'Recent attempts', value: attempts?.length ?? '—' },
    { icon: Target, label: 'Average recent score', value: averageScore === null ? '—' : `${averageScore}%` },
  ];

  return (
    <div className="app-night dashboard-page">
      <header className="app-wrap app-topbar glass-panel">
        <AppBrand />
        <button type="button" className="app-button app-button-outline" onClick={handleLogout}>
          <LogOut aria-hidden="true" size={17} /> Sign out
        </button>
      </header>

      <main className="app-wrap dashboard-content">
        <section className="dashboard-hero glass-panel" aria-labelledby="dashboard-title">
          <div>
            <p className="dashboard-greeting">Welcome, {displayName}</p>
            <h1 id="dashboard-title">Practice dashboard</h1>
            <p>Build timed quizzes, pick one to practise, or revisit a recent attempt.</p>
          </div>
          <Link className="app-button app-button-primary" to="/create-quiz"><Plus aria-hidden="true" size={19} /> Create a quiz</Link>
        </section>

        {logoutError && <p className="auth-message auth-error" role="alert">{logoutError}</p>}
        {loadError && <p className="auth-message auth-error" role="alert">{loadError}</p>}

        {loading ? <LoadingSpinner text="Loading your practice data…" compact /> : (
          <>
            <dl className="dashboard-metrics" aria-label="Practice overview">
              {metrics.map(({ icon: Icon, label, value }) => (
                <div className="dashboard-metric glass-panel" key={label}>
                  <span className="app-icon"><Icon aria-hidden="true" size={20} /></span>
                  <div><dt>{label}</dt><dd>{value}</dd></div>
                </div>
              ))}
            </dl>

            <div className="dashboard-lists">
              <section className="dashboard-list glass-panel" aria-labelledby="quizzes-heading">
                <div className="dashboard-section-heading">
                  <h2 id="quizzes-heading">My quizzes</h2>
                  <a className="app-button app-button-outline" href="https://www.youtube.com/watch?v=r6SyDDWYnYE" target="_blank" rel="noopener noreferrer">
                    <PlayCircle aria-hidden="true" size={17} /> Tutorial
                  </a>
                </div>
                {quizzes?.length ? (
                  <ul className="dashboard-rows">
                    {quizzes.slice(0, 5).map((quiz) => (
                      <li key={quiz.id}>
                        <div><h3>{quiz.title}</h3><p>{quiz.total_questions} questions · {quiz.time_limit} min</p></div>
                        <Link className="app-button app-button-outline" to={`/quiz/${quiz.id}`}>
                          Start quiz <ArrowRight aria-hidden="true" size={16} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="dashboard-empty">
                    <span className="app-icon"><ClipboardList aria-hidden="true" size={22} /></span>
                    <h3>{quizzes === null ? 'Quizzes unavailable' : 'No quizzes yet'}</h3>
                    {quizzes !== null && <p>Create a quiz to import questions and set a time limit.</p>}
                  </div>
                )}
              </section>

              <section className="dashboard-list glass-panel" aria-labelledby="attempts-heading">
                <div className="dashboard-section-heading"><h2 id="attempts-heading">Recent attempts</h2></div>
                {attempts?.length ? (
                  <ul className="dashboard-rows">
                    {attempts.map((attempt) => (
                      <li key={attempt.id}>
                        <div>
                          <h3>{attempt.quizzes?.title ?? 'Quiz'}</h3>
                          <p>Score {attempt.score}/{attempt.quizzes?.total_questions ?? attempt.total_questions} ({attempt.percentage}%)</p>
                          <p>{new Date(attempt.created_at).toLocaleDateString()}</p>
                        </div>
                        <Link className="app-button app-button-outline" to={`/review/${attempt.id}`}>
                          Review <ArrowRight aria-hidden="true" size={16} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="dashboard-empty">
                    <span className="app-icon"><Clock3 aria-hidden="true" size={22} /></span>
                    <h3>{attempts === null ? 'Attempts unavailable' : 'No attempts yet'}</h3>
                    {attempts !== null && <p>Take a quiz to see your score and review your answers here.</p>}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        <aside className="dashboard-guide glass-panel" aria-label="NSCT study guide">
          <span className="app-icon"><BookOpen aria-hidden="true" size={20} /></span>
          <div><strong>NSCT study guide</strong><p>Find test topics and try a practice question.</p></div>
          <a className="app-button app-button-outline" href="/#study-guide">Open guide <ArrowUpRight aria-hidden="true" size={16} /></a>
        </aside>
        <aside aria-label="Comova Systems promotion">
          <a className="promotion-card" href="https://www.comovasystems.com/" target="_blank" rel="noopener noreferrer sponsored">
            <img src="/comova-systems-banner.jpg" width={576} height={480} loading="lazy" decoding="async" alt="" />
            <div className="promotion-details">
              <span className="promotion-label">Promotion</span>
              <strong>Comova Systems</strong>
              <p>Websites, custom software, AI and SEO.</p>
              <span className="promotion-link">Visit website <ArrowUpRight aria-hidden="true" size={14} /><span className="promotion-screen-reader"> (opens in a new tab)</span></span>
            </div>
          </a>
        </aside>
      </main>

      <footer className="app-wrap dashboard-footer">
        <p>Built by <a href="https://www.husnainmazhar.com/">Husnain Mazhar</a></p>
        <a href="https://husnainmazhar.com/#contact">Feedback <ArrowUpRight aria-hidden="true" size={15} /></a>
      </footer>
    </div>
  );
}
