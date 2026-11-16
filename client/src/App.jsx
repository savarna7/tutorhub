import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Tutors from './pages/Tutors';
import TutorProfile from './pages/TutorProfile';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import Profile from './pages/Profile';
import VerifyEmailChange from './pages/VerifyEmailChange';
import './App.css';


function Home() {
    return (
        <>
            <main>
                {/* Hero Section */}
                <section className="hero">
                    <div>
                        <span className="eyebrow">
                            LEARN WITHOUT LIMITS
                        </span>

                        <h1>
                            Find the right tutor.
                            <br />
                            Reach your goals.
                        </h1>

                        <p className="hero-description">
                            Connect with tutors who can help you learn,
                            improve your skills and achieve your academic goals.
                        </p>

                        <div className="hero-actions">
                            <Link to="/tutors" className="primary-button">
                                Explore Tutors
                            </Link>

                            <Link to="/register" className="signup-button">
                                Get Started
                            </Link>
                        </div>

                        <p className="trust-note">
                            Whether you want to learn or teach, there's a place
                            for you at TutorHub.
                        </p>
                    </div>

                    {/* Decorative Tutor Card */}
                    <div className="hero-card">
                        <div className="card-top">
                            <span className="card-label">
                                YOUR LEARNING JOURNEY
                            </span>
                            <span>✦</span>
                        </div>

                        <div className="tutor-avatar">
                            TH
                        </div>

                        <h2>Learn something new.</h2>

                        <p>
                            Discover subjects, connect with tutors and
                            schedule your learning sessions.
                        </p>

                        <div className="tutor-stats">
                            <span>Discover</span>
                            <span>Learn</span>
                            <span>Grow</span>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features">
                    <div className="section-heading">
                        <span className="eyebrow">WHY TUTORHUB?</span>
                        <h2>Everything you need to learn better</h2>
                        <p>
                            A simple platform that brings students and
                            tutors together.
                        </p>
                    </div>

                    <div className="feature-grid">
                        <article className="feature-card">
                            <span>01</span>
                            <h3>Find the Right Tutor</h3>
                            <p>
                                Explore tutor profiles, compare subjects
                                and find someone who matches your needs.
                            </p>
                        </article>

                        <article className="feature-card">
                            <span>02</span>
                            <h3>Manage Your Sessions</h3>
                            <p>
                                Request learning sessions and keep track
                                of your bookings in your dashboard.
                            </p>
                        </article>

                        <article className="feature-card">
                            <span>03</span>
                            <h3>Teach and Earn</h3>
                            <p>
                                Create your tutor profile, share your
                                expertise and manage student requests.
                            </p>
                        </article>
                    </div>
                </section>

                {/* Tutor CTA Section */}
                <section className="tutor-cta">
                    <div>
                        <span className="eyebrow">SHARE YOUR KNOWLEDGE</span>
                        <h2>Ready to become a tutor?</h2>
                        <p>
                            Create your tutor profile and connect with
                            students looking to learn.
                        </p>
                    </div>

                    <Link to="/register" className="primary-button">
                        Join as a Tutor
                    </Link>
                </section>
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>© {new Date().getFullYear()} TutorHub. Learn. Teach. Grow.</p>

                <div>
                    <Link to="/">Home</Link>
                    <Link to="/tutors">Explore Tutors</Link>
                    <Link to="/register">Sign Up</Link>
                </div>
            </footer>
        </>
    );
}


function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutors" element={<Tutors />} />
          <Route path="/tutors/:tutorId" element={<TutorProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/verify-email-change"
            element={<VerifyEmailChange />}
          />

          {/* Profile protected route */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>

          {/* Student protected routes */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route
              path="/student/dashboard"
              element={<StudentDashboard />}
            />
          </Route>

          {/* Tutor protected routes */}
          <Route element={<ProtectedRoute allowedRole="tutor" />}>
            <Route
              path="/tutor/dashboard"
              element={<TutorDashboard />}
            />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;