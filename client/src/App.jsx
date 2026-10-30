
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="/">
          Tutor<span>Hub</span>
        </a>

        <nav className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#tutors">Find tutors</a>
        </nav>

        <div className="nav-actions">
          <button className="login-button">Log in</button>
          <button className="signup-button">Get started</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">LEARN BETTER. GO FURTHER.</p>

            <h1>
              Find the right tutor.
              <br />
              <span>Unlock your potential.</span>
            </h1>

            <p className="hero-description">
              Connect with tutors who understand your goals.
              Learn at your pace and make every lesson count.
            </p>

            <div className="hero-actions">
              <button className="primary-button">
                Find your tutor →
              </button>
              <a className="secondary-link" href="#how-it-works">
                See how it works
              </a>
            </div>

            <div className="trust-note">
              <span className="trust-dot"></span>
              Your learning journey starts here.
            </div>
          </div>

          <div className="hero-card" aria-label="Example tutor profile">
            <div className="card-top">
              <span className="card-label">MEET YOUR NEXT TUTOR</span>
              <span className="online-dot"></span>
            </div>

            <div className="tutor-avatar">T</div>

            <h2>Your future tutor</h2>
            <p className="tutor-subtitle">Personalized learning, your way</p>

            <div className="tutor-stats">
              <div>
                <strong>1:1</strong>
                <span>Learning</span>
              </div>
              <div>
                <strong>Your pace</strong>
                <span>Your goals</span>
              </div>
            </div>

            <div className="card-footer">
              <span>✦</span>
              A learning experience built around you
            </div>
          </div>
        </section>

        <section className="features" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">WHY TUTORHUB?</p>
            <h2>Learning should feel personal.</h2>
            <p>Find support that fits the way you learn.</p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-icon">⌕</span>
              <h3>Find your match</h3>
              <p>Discover tutors based on the subjects you want to master.</p>
            </article>

            <article className="feature-card">
              <span className="feature-icon">◎</span>
              <h3>Learn your way</h3>
              <p>Focus on your goals with a more personal learning experience.</p>
            </article>

            <article className="feature-card">
              <span className="feature-icon">↗</span>
              <h3>Keep progressing</h3>
              <p>Build confidence one lesson and one concept at a time.</p>
            </article>
          </div>
        </section>

        <section className="tutor-cta" id="tutors">
          <div>
            <p className="eyebrow">READY TO GET STARTED?</p>
            <h2>Your next breakthrough begins with one lesson.</h2>
          </div>
          <button className="primary-button">Explore tutoring →</button>
        </section>
      </main>

      <footer className="footer">
        <a className="logo" href="/">
          Tutor<span>Hub</span>
        </a>
        <p>Made for curious minds and ambitious learners.</p>
      </footer>
    </div>
  );
}

export default App;
