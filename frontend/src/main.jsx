import React, { createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });

api.interceptors.request.use(config => {
  const token = localStorage.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.user || 'null');
    } catch {
      return null;
    }
  });

  const login = (data) => {
    localStorage.token = data.token;
    localStorage.user = JSON.stringify(data);
    setUser(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// UI Components
const Chip = ({ children }) => <span className="chip">{children}</span>;
const Card = ({ children, className = '', onClick }) => (
  <article className={`card ${className} ${onClick ? 'hoverable' : ''}`} onClick={onClick}>
    {children}
  </article>
);

const StarRating = ({ rating, onChange, readOnly = false }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`star-rating ${readOnly ? 'readonly' : ''}`}>
      {stars.map(s => (
        <span
          key={s}
          className={`star ${s <= Math.round(rating) ? 'active' : ''}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

// Layout with Notifications & Responsive Header
function Layout({ children }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const loadNotifications = () => {
    if (user) {
      api.get('/api/notifications')
        .then(res => {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.read).length);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <>
      <header>
        <Link className="brand" to="/" id="nav-brand">
          tutor<span>link</span>
        </Link>
        <nav>
          <NavLink to="/find-tutor" id="nav-find-tutor">Find tutors</NavLink>
          <NavLink to="/find-jobs" id="nav-find-jobs">Find jobs</NavLink>

          {user ? (
            <>
              {user.role === 'PARENT' && (
                <>
                  <NavLink to="/parent/dashboard" id="nav-parent-dashboard">Dashboard</NavLink>
                  <Link to="/parent/post-tuition" className="button small accent" id="nav-post-tuition">+ Post Tuition</Link>
                </>
              )}
              {user.role === 'STUDENT' && (
                <NavLink to="/student/dashboard" id="nav-tutor-dashboard">Tutor Dashboard</NavLink>
              )}
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" id="nav-admin-portal">Admin Portal</NavLink>
              )}

              {/* Notification Center */}
              <div style={{ position: 'relative' }}>
                <button
                  className="notification-bell-btn"
                  id="btn-notifications-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge" id="badge-unread-count">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-popover" id="notifications-dropdown">
                    <div className="row" style={{ padding: '12px 18px', borderBottom: '1px solid #f0f0ec' }}>
                      <b>Notifications</b>
                      <small style={{ color: '#888' }}>{unreadCount} unread</small>
                    </div>
                    {notifications.length === 0 ? (
                      <p style={{ padding: '24px', textAlign: 'center', color: '#888' }}>No notifications yet</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          className={`notification-item ${!n.read ? 'unread' : ''}`}
                          id={`notification-item-${n.id}`}
                        >
                          {!n.read && <div className="notification-dot" />}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#181919' }}>{n.title}</div>
                            <div style={{ color: '#555', marginTop: '2px', fontSize: '12px' }}>{n.body}</div>
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {!n.read && (
                            <button
                              className="button tiny ghost"
                              onClick={(e) => markAsRead(n.id, e)}
                              title="Mark read"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Profile Badge */}
              <div className="user-badge" id="user-profile-badge">
                <span className="avatar" style={{ width: 26, height: 26, fontSize: 12 }}>
                  {user.name ? user.name[0] : 'U'}
                </span>
                <span>{user.name.split(' ')[0]}</span>
                <span className="role-tag">{user.role}</span>
              </div>

              <button className="link muted" id="btn-signout" onClick={logout}>Sign out</button>
            </>
          ) : (
            <div className="nav-actions">
              <Link to="/login" id="nav-signin">Sign in</Link>
              <Link className="button small" to="/register" id="nav-getstarted">Get started</Link>
            </div>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        © 2026 TutorLink Marketplace · Empowering college tutors, supporting every family.
      </footer>
    </>
  );
}

// Home Page
function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">THE SMARTER LOCAL TUTOR MARKETPLACE</p>
          <h1>Find a Tutor.<br /><i>Earn by Teaching.</i></h1>
          <p className="hero-subtitle">
            Connect parents with verified college student tutors for personalized, affordable home and online tuition.
          </p>
          <div className="actions">
            <Link className="button accent" to="/find-tutor" id="hero-find-tutor">Find a tutor</Link>
            <Link className="button ghost" to="/register" id="hero-become-tutor">Become a tutor</Link>
          </div>
        </div>
        <div className="hero-card">
          <span className="badge verified">✓ Verified college tutors</span>
          <h3>“My daughter finally enjoys maths.”</h3>
          <p>
            Match on subject, schedule, area, and budget. Transparent profiles, structured reviews, and zero hassle.
          </p>
          <div className="stats-row">
            <div className="stat-item">
              <b>10k+</b>
              <small>families helped</small>
            </div>
            <div className="stat-item">
              <b>4.9 / 5</b>
              <small>average tutor rating</small>
            </div>
            <div className="stat-item">
              <b>100%</b>
              <small>student-verified</small>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container">
        <p className="eyebrow">HOW IT WORKS</p>
        <h2>Good matches, without the guesswork.</h2>
        <div className="grid three">
          <Card>
            <em style={{ color: 'var(--accent)', fontWeight: 800 }}>01</em>
            <h3 style={{ margin: '12px 0 8px' }}>Post what you need</h3>
            <p style={{ color: '#555' }}>
              Share class, subject, location, schedule, and budget. It only takes two minutes.
            </p>
          </Card>
          <Card>
            <em style={{ color: 'var(--accent)', fontWeight: 800 }}>02</em>
            <h3 style={{ margin: '12px 0 8px' }}>Instant smart matching</h3>
            <p style={{ color: '#555' }}>
              Our compatibility algorithm scores tutors on subjects, proximity, mode, and fees.
            </p>
          </Card>
          <Card>
            <em style={{ color: 'var(--accent)', fontWeight: 800 }}>03</em>
            <h3 style={{ margin: '12px 0 8px' }}>Learn, track & review</h3>
            <p style={{ color: '#555' }}>
              Accept applications, run active tuitions with confidence, and leave verified ratings.
            </p>
          </Card>
        </div>
      </section>

      <section style={{ background: '#1d2020', color: '#fff', textAlign: 'center', padding: '70px 20px' }}>
        <h2 style={{ color: '#fff', fontSize: '38px', marginBottom: '16px' }}>Ready for a better tutor match?</h2>
        <p style={{ color: '#bbb', maxWidth: '500px', margin: '0 auto 28px' }}>
          Find high-achieving university mentors in your neighborhood today.
        </p>
        <Link className="button accent" to="/register" id="cta-post-tuition">Post a tuition requirement</Link>
      </section>
    </>
  );
}

// Login
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'akshay@example.com', password: 'Password@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (email) => {
    setForm({ email, password: 'Password@123' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      login(res.data);
      if (res.data.role === 'ADMIN') navigate('/admin');
      else if (res.data.role === 'PARENT') navigate('/parent/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth" id="login-section">
      <p className="eyebrow">WELCOME BACK</p>
      <h2>Sign in to TutorLink</h2>

      <div style={{ margin: '16px 0', background: '#f6f5f1', padding: '12px', borderRadius: '8px' }}>
        <small style={{ fontWeight: 600, display: 'block', marginBottom: '6px', color: '#555' }}>Quick Demo Accounts:</small>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="button tiny ghost" id="demo-parent" onClick={() => fillDemo('priya@example.com')}>
            Parent (Priya)
          </button>
          <button type="button" className="button tiny ghost" id="demo-tutor" onClick={() => fillDemo('akshay@example.com')}>
            Tutor (Akshay)
          </button>
          <button type="button" className="button tiny ghost" id="demo-admin" onClick={() => fillDemo('admin@tutorlink.in')}>
            Admin
          </button>
        </div>
      </div>

      {error && <div className="alert error" id="login-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. name@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            id="login-password"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>
        <button className="button" id="btn-submit-login" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        New to TutorLink? <Link to="/register" className="link">Create an account</Link>
      </p>
    </section>
  );
}

// Register
function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'PARENT',
    phone: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', form);
      login(res.data);
      if (form.role === 'PARENT') navigate('/parent/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth" id="register-section">
      <p className="eyebrow">JOIN TUTORLINK</p>
      <h2>Create your account</h2>

      {error && <div className="alert error" id="register-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group">
          <label>I want to</label>
          <select
            id="register-role"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="PARENT">Find a tutor for my child (Parent)</option>
            <option value="STUDENT">Offer tutoring & earn (College Student)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input
            id="register-name"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            placeholder="Full name"
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            id="register-email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Password (8+ characters)</label>
          <input
            id="register-password"
            type="password"
            minLength="8"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City / Locality</label>
            <input
              id="register-location"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Kukatpally, Hyderabad"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              id="register-phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        <button className="button accent" id="btn-submit-register" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        Already have an account? <Link to="/login" className="link">Sign in</Link>
      </p>
    </section>
  );
}

// Tutor Detail Modal
function TutorDetailModal({ tutor, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (tutor) {
      api.get(`/api/reviews/tutor/${tutor.user.id}`)
        .then(res => setReviews(res.data))
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [tutor]);

  if (!tutor) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} id="tutor-detail-backdrop">
      <div className="modal large" onClick={e => e.stopPropagation()} id="tutor-detail-modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar" style={{ width: 50, height: 50, fontSize: 20 }}>
              {tutor.user.fullName[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '22px' }}>{tutor.user.fullName}</h3>
                {tutor.verificationStatus === 'VERIFIED' && (
                  <span className="badge verified">✓ Verified Tutor</span>
                )}
              </div>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {tutor.degree} {tutor.branch ? `in ${tutor.branch}` : ''} · {tutor.college}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="grid two" style={{ marginTop: '16px' }}>
          <div>
            <div style={{ marginBottom: '14px' }}>
              <b style={{ color: '#555', fontSize: '12px', textTransform: 'uppercase' }}>About Tutor</b>
              <p style={{ marginTop: '6px', color: '#333' }}>{tutor.bio || 'Experienced college tutor dedicated to helping students excel in core subjects.'}</p>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <b style={{ color: '#555', fontSize: '12px', textTransform: 'uppercase' }}>Key Details</b>
              <p style={{ fontSize: '14px', marginTop: '6px', color: '#444', lineHeight: '1.8' }}>
                📍 Location: <b>{tutor.location}</b><br />
                💼 Experience: <b>{tutor.experienceYears} years</b><br />
                💻 Mode: <b>{tutor.teachingMode}</b><br />
                ⏰ Availability: <b>{tutor.availability || 'Flexible'}</b><br />
                💵 Monthly Fee: <b style={{ color: 'var(--accent)' }}>₹{tutor.monthlyFee?.toLocaleString()}/month</b>
              </p>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <b style={{ color: '#555', fontSize: '12px', textTransform: 'uppercase' }}>Subjects & Classes</b>
              <div style={{ marginTop: '6px' }}>
                {[...(tutor.subjects || [])].map(s => <Chip key={s}>{s}</Chip>)}
                {[...(tutor.classes || [])].map(c => <span key={c} className="chip" style={{ background: '#e5eef7' }}>Class {c}</span>)}
              </div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #f0f0ec', paddingLeft: '20px' }}>
            <div className="row" style={{ marginBottom: '16px' }}>
              <div>
                <b style={{ fontSize: '26px' }}>★ {tutor.rating ? tutor.rating.toFixed(1) : 'New'}</b>
                <small style={{ display: 'block', color: '#666' }}>{tutor.completedTuitions || 0} completed tuitions</small>
              </div>
            </div>

            <b style={{ color: '#555', fontSize: '12px', textTransform: 'uppercase' }}>Parent Reviews ({reviews.length})</b>
            <div style={{ marginTop: '10px', display: 'grid', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {loadingReviews ? (
                <p style={{ color: '#888' }}>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic', fontSize: '13px' }}>No reviews yet for this tutor.</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} style={{ background: '#fbfbfa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <div className="row">
                      <StarRating rating={rev.rating} readOnly />
                      <small style={{ color: '#999' }}>{new Date(rev.createdAt).toLocaleDateString()}</small>
                    </div>
                    <p style={{ fontSize: '13px', marginTop: '6px', color: '#333' }}>"{rev.text}"</p>
                    <small style={{ color: '#777', display: 'block', marginTop: '4px' }}>— {rev.parent?.fullName || 'Parent'}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Find Tutors
function Tutors() {
  const [list, setList] = useState([]);
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    const params = {};
    if (subject.trim()) params.subject = subject.trim();
    if (location.trim()) params.location = location.trim();
    api.get('/api/tutors', { params }).then(res => setList(res.data)).catch(() => {});
  }, [subject, location]);

  return (
    <section className="page-container" id="find-tutors-page">
      <p className="eyebrow">BROWSE DIRECTORY</p>
      <h2>Meet verified college tutors</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Tutors are verified university students matched by academic background and location.
      </p>

      <div className="search-bar">
        <input
          id="search-tutor-subject"
          style={{ flex: 1, minWidth: '220px' }}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Filter by subject (e.g. Mathematics, Physics, Science)"
        />
        <input
          id="search-tutor-location"
          style={{ width: '240px' }}
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Filter by locality / city"
        />
      </div>

      <div className="grid three" id="tutors-grid">
        {list.map(t => (
          <Card key={t.id} className="hoverable" onClick={() => setSelectedTutor(t)}>
            <div className="row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3>{t.user.fullName}</h3>
                  {t.verificationStatus === 'VERIFIED' && (
                    <span className="badge verified" style={{ fontSize: '10px' }}>✓ Verified</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#666' }}>{t.degree} · {t.college}</p>
              </div>
              <div className="avatar">{t.user.fullName[0]}</div>
            </div>

            <div style={{ margin: '12px 0' }}>
              {[...(t.subjects || [])].slice(0, 3).map(s => <Chip key={s}>{s}</Chip>)}
            </div>

            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
              ★ <b>{t.rating ? t.rating.toFixed(1) : 'New'}</b> ({t.completedTuitions || 0} completed)<br />
              📍 {t.location} · {t.experienceYears} yrs exp · {t.teachingMode}
            </p>

            <div className="row" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0ec' }}>
              <b style={{ color: 'var(--accent)', fontSize: '16px' }}>₹{t.monthlyFee?.toLocaleString()}/mo</b>
              <button className="button tiny ghost" id={`btn-view-tutor-${t.id}`}>View Profile →</button>
            </div>
          </Card>
        ))}
      </div>

      {selectedTutor && (
        <TutorDetailModal tutor={selectedTutor} onClose={() => setSelectedTutor(null)} />
      )}
    </section>
  );
}

// Find Jobs with Apply Modal
function Jobs() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [applyingJob, setApplyingJob] = useState(null);
  const [coverMessage, setCoverMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadJobs = () => {
    const params = {};
    if (subject.trim()) params.subject = subject.trim();
    if (location.trim()) params.location = location.trim();
    api.get('/api/tuition', { params }).then(res => setList(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadJobs();
  }, [subject, location]);

  const handleApplyClick = (job) => {
    if (!user) {
      alert('Please sign in as a student/tutor to apply for tuitions.');
      return;
    }
    if (user.role !== 'STUDENT') {
      alert('Only student/tutor accounts can apply for tuition jobs.');
      return;
    }
    setApplyingJob(job);
    setCoverMessage(`Hello, I am interested in tutoring Class ${job.studentClass} ${[...job.subjects].join(', ')}. I have strong subject mastery and a flexible schedule.`);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      await api.post('/api/applications', {
        requirementId: applyingJob.id,
        message: coverMessage
      });
      alert('Application submitted successfully! The parent has been notified.');
      setApplyingJob(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-container" id="find-jobs-page">
      <p className="eyebrow">TUTORING OPPORTUNITIES</p>
      <h2>Find Tuition Jobs</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Browse verified parent tuition requirements. Apply directly with your preferred schedule and message.
      </p>

      <div className="search-bar">
        <input
          id="search-job-subject"
          style={{ flex: 1, minWidth: '220px' }}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Filter by subject (e.g. Mathematics, Science)"
        />
        <input
          id="search-job-location"
          style={{ width: '240px' }}
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Filter by locality / area"
        />
      </div>

      <div className="grid three" id="jobs-grid">
        {list.map(j => (
          <Card key={j.id}>
            <div className="row">
              <h3 style={{ fontSize: '18px' }}>Class {j.studentClass} Tuition</h3>
              <span className="chip" style={{ background: '#eef4fb', color: '#1f5f9e' }}>{j.teachingMode}</span>
            </div>

            <div style={{ margin: '10px 0' }}>
              {[...(j.subjects || [])].map(s => <Chip key={s}>{s}</Chip>)}
            </div>

            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
              📍 <b>{j.location}</b><br />
              🗓 {j.days || 'Flexible days'}<br />
              ⏰ {j.preferredTime || 'Evening hours'}<br />
              {j.additionalRequirements && <span style={{ fontStyle: 'italic', color: '#777' }}>“{j.additionalRequirements}”</span>}
            </p>

            <div className="row" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0ec' }}>
              <div>
                <b style={{ fontSize: '16px', color: 'var(--accent)' }}>₹{j.budget?.toLocaleString()}</b>
                <small style={{ display: 'block', color: '#777' }}>per month</small>
              </div>
              <button
                className="button small accent"
                id={`btn-apply-job-${j.id}`}
                onClick={() => handleApplyClick(j)}
              >
                Apply Now →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {applyingJob && (
        <div className="modal-backdrop" onClick={() => setApplyingJob(null)} id="apply-job-backdrop">
          <div className="modal" onClick={e => e.stopPropagation()} id="apply-job-modal">
            <div className="modal-header">
              <h3>Apply for Class {applyingJob.studentClass} Tuition</h3>
              <button className="modal-close" onClick={() => setApplyingJob(null)}>✕</button>
            </div>

            <div style={{ background: '#fbfbfa', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              <b>Location:</b> {applyingJob.location} · <b>Budget:</b> ₹{applyingJob.budget?.toLocaleString()}/mo · <b>Mode:</b> {applyingJob.teachingMode}
            </div>

            <form onSubmit={submitApplication}>
              <div className="form-group">
                <label>Cover Note / Introduction to Parent</label>
                <textarea
                  id="apply-cover-message"
                  rows="4"
                  value={coverMessage}
                  onChange={e => setCoverMessage(e.target.value)}
                  placeholder="Introduce yourself, your academic achievements, and teaching approach..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="button ghost" onClick={() => setApplyingJob(null)}>Cancel</button>
                <button type="submit" className="button accent" id="btn-submit-application" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Send Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// Post Tuition Requirement Page
function PostTuition() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    studentClass: '10th',
    subjects: ['Mathematics'],
    location: user?.location || 'Kukatpally',
    teachingMode: 'Both',
    days: 'Monday, Wednesday, Friday',
    preferredTime: '5 PM – 7 PM',
    budget: 3500,
    classesPerWeek: 3,
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    additionalRequirements: 'Looking for an enthusiastic, patient college student.'
  });
  const [subjectInput, setSubjectInput] = useState('Mathematics, Science');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        subjects: subjectInput.split(',').map(s => s.trim()).filter(Boolean)
      };
      await api.post('/api/tuition', payload);
      alert('Tuition requirement posted successfully! Redirecting to matches...');
      navigate('/parent/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post requirement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth wide" id="post-tuition-section">
      <p className="eyebrow">PARENT PORTAL</p>
      <h2>Post a Tuition Requirement</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Fill out your child's requirements. Our smart matching will immediately suggest compatible tutors.
      </p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={submit} className="form-grid">
        <div className="form-row">
          <div className="form-group">
            <label>Student Class / Grade</label>
            <select
              id="post-student-class"
              value={form.studentClass}
              onChange={e => setForm({ ...form, studentClass: e.target.value })}
            >
              {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => (
                <option key={c} value={c}>{c} Class</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Teaching Mode</label>
            <select
              id="post-teaching-mode"
              value={form.teachingMode}
              onChange={e => setForm({ ...form, teachingMode: e.target.value })}
            >
              <option value="Both">Both (Offline & Online)</option>
              <option value="Offline">Offline / Home Tuition</option>
              <option value="Online">Online Tuition</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Subjects Required (Comma-separated)</label>
          <input
            id="post-subjects"
            value={subjectInput}
            onChange={e => setSubjectInput(e.target.value)}
            placeholder="e.g. Mathematics, Science, Physics"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Location / Area</label>
            <input
              id="post-location"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Kukatpally, Hyderabad"
              required
            />
          </div>
          <div className="form-group">
            <label>Monthly Budget (₹)</label>
            <input
              id="post-budget"
              type="number"
              value={form.budget}
              onChange={e => setForm({ ...form, budget: +e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Preferred Days</label>
            <input
              id="post-days"
              value={form.days}
              onChange={e => setForm({ ...form, days: e.target.value })}
              placeholder="e.g. Monday, Wednesday, Friday"
            />
          </div>
          <div className="form-group">
            <label>Preferred Time Slot</label>
            <input
              id="post-time"
              value={form.preferredTime}
              onChange={e => setForm({ ...form, preferredTime: e.target.value })}
              placeholder="e.g. 5 PM - 7 PM"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Classes Per Week</label>
            <input
              id="post-classes-per-week"
              type="number"
              value={form.classesPerWeek}
              onChange={e => setForm({ ...form, classesPerWeek: +e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tentative Start Date</label>
            <input
              id="post-start-date"
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Additional Notes / Learning Needs</label>
          <textarea
            id="post-notes"
            rows="3"
            value={form.additionalRequirements}
            onChange={e => setForm({ ...form, additionalRequirements: e.target.value })}
            placeholder="e.g. Patient tutor with strong problem-solving skills for board exam prep."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button className="button accent" id="btn-publish-requirement" type="submit" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Requirement & Find Matches'}
          </button>
          <button type="button" className="button ghost" onClick={() => navigate('/parent/dashboard')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

// Smart Match Modal
function SmartMatchModal({ requirement, onClose, onSelectTutor }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requirement) {
      api.get(`/api/matching/tutors/${requirement.id}`)
        .then(res => setMatches(res.data))
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    }
  }, [requirement]);

  return (
    <div className="modal-backdrop" onClick={onClose} id="smart-match-backdrop">
      <div className="modal large" onClick={e => e.stopPropagation()} id="smart-match-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">SMART MATCHING ALGORITHM</span>
            <h3>Top Matched Tutors for Class {requirement.studentClass}</h3>
            <small style={{ color: '#666' }}>
              Subjects: {[...(requirement.subjects || [])].join(', ')} · Location: {requirement.location} · Budget: ₹{requirement.budget?.toLocaleString()}
            </small>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Calculating compatibility scores...</p>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <h4>No matching tutors found yet</h4>
            <p>Try broadening your location or budget to see more compatible students.</p>
          </div>
        ) : (
          <div className="grid two" style={{ marginTop: '16px' }}>
            {matches.map(m => (
              <Card key={m.tutor.id} className="hoverable">
                <div className="row">
                  <div>
                    <h3 style={{ fontSize: '17px' }}>{m.tutor.user.fullName}</h3>
                    <p style={{ fontSize: '13px', color: '#666' }}>{m.tutor.degree} · {m.tutor.college}</p>
                  </div>
                  <span className="badge score" id={`match-score-${m.tutor.id}`}>
                    {m.score}% Match
                  </span>
                </div>

                <div style={{ margin: '10px 0' }}>
                  {[...(m.tutor.subjects || [])].slice(0, 3).map(s => <Chip key={s}>{s}</Chip>)}
                </div>

                <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
                  ★ {m.tutor.rating ? m.tutor.rating.toFixed(1) : 'New'} · 📍 {m.tutor.location}<br />
                  Mode: {m.tutor.teachingMode} · Fee: ₹{m.tutor.monthlyFee?.toLocaleString()}/mo
                </p>

                <div className="row" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                  <button
                    className="button tiny ghost"
                    id={`btn-view-match-profile-${m.tutor.id}`}
                    onClick={() => onSelectTutor(m.tutor)}
                  >
                    View Full Profile & Reviews →
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Review Submission Modal
function ReviewModal({ activeTuition, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('Excellent tutor! Very patient and knowledgeable.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/reviews', {
        activeTuitionId: activeTuition.id,
        rating,
        text
      });
      alert('Review submitted successfully! Thank you for rating your tutor.');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="review-modal-backdrop">
      <div className="modal" onClick={e => e.stopPropagation()} id="review-modal">
        <div className="modal-header">
          <h3>Leave a Review for {activeTuition.tutor.fullName}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit}>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Overall Rating</label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StarRating rating={rating} onChange={setRating} />
            </div>
            <small style={{ color: '#777', display: 'block', marginTop: '6px' }}>{rating} out of 5 stars</small>
          </div>

          <div className="form-group">
            <label>Detailed Feedback</label>
            <textarea
              id="review-text-input"
              rows="4"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="How was the tutor's punctuality, subject grasp, and communication?"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="button ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="button accent" id="btn-submit-review" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Rating & Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Parent Dashboard
function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requirements');
  const [requirements, setRequirements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTuitions, setActiveTuitions] = useState([]);
  const [smartMatchReq, setSmartMatchReq] = useState(null);
  const [reviewingTuition, setReviewingTuition] = useState(null);
  const [viewingTutor, setViewingTutor] = useState(null);
  const [completedTuitions, setCompletedTuitions] = useState([]);

  const loadAll = async () => {
    try {
      const [reqsRes, appsRes, activeRes] = await Promise.all([
        api.get('/api/tuition/my'),
        api.get('/api/applications/my'),
        api.get('/api/active-tuitions')
      ]);
      setRequirements(reqsRes.data);
      setApplications(appsRes.data);
      const actives = activeRes.data;
      setActiveTuitions(actives.filter(a => a.status === 'ACTIVE'));
      setCompletedTuitions(actives.filter(a => a.status === 'COMPLETED'));
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApplicationStatus = async (appId, status) => {
    try {
      await api.put(`/api/applications/${appId}/status`, { status });
      alert(`Application marked as ${status}.`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
    }
  };

  const handleCompleteTuition = async (tuitionId) => {
    if (!window.confirm('Are you sure you want to mark this tuition as completed?')) return;
    try {
      const res = await api.put(`/api/active-tuitions/${tuitionId}/complete`);
      alert('Tuition completed! Please take a moment to leave a review.');
      await loadAll();
      setReviewingTuition(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not complete tuition');
    }
  };

  return (
    <section className="page-container" id="parent-dashboard-page">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">PARENT DASHBOARD</p>
          <h2>Welcome, {user?.name}</h2>
          <p style={{ color: '#666' }}>Manage tuition requests, review applicants, and track active tuitions.</p>
        </div>
        <Link className="button accent" to="/parent/post-tuition" id="btn-dashboard-post-tuition">
          + Post New Requirement
        </Link>
      </div>

      <div className="metrics">
        <div className="metric-card">
          <b>{requirements.length}</b>
          <small>Posted Requirements</small>
        </div>
        <div className="metric-card">
          <b>{applications.length}</b>
          <small>Applications Received</small>
        </div>
        <div className="metric-card">
          <b>{activeTuitions.length}</b>
          <small>Active Tuitions</small>
        </div>
        <div className="metric-card">
          <b>{completedTuitions.length}</b>
          <small>Completed Tuitions</small>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'requirements' ? 'active' : ''}`}
          id="tab-requirements"
          onClick={() => setActiveTab('requirements')}
        >
          My Requirements <span className="tab-badge">{requirements.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          id="tab-applications"
          onClick={() => setActiveTab('applications')}
        >
          Received Applications <span className="tab-badge">{applications.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          id="tab-active-tuitions"
          onClick={() => setActiveTab('active')}
        >
          Active Tuitions <span className="tab-badge">{activeTuitions.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          id="tab-completed-tuitions"
          onClick={() => setActiveTab('completed')}
        >
          Completed & Reviews <span className="tab-badge">{completedTuitions.length}</span>
        </button>
      </div>

      {/* TAB 1: REQUIREMENTS */}
      {activeTab === 'requirements' && (
        <div id="section-requirements">
          {requirements.length === 0 ? (
            <div className="empty-state">
              <h4>No tuition requirements posted yet</h4>
              <p>Post a requirement to start receiving matched tutors.</p>
              <Link className="button small accent" to="/parent/post-tuition" style={{ marginTop: '12px' }}>
                Post Requirement
              </Link>
            </div>
          ) : (
            <div className="grid two">
              {requirements.map(r => (
                <Card key={r.id}>
                  <div className="row">
                    <h3 style={{ fontSize: '18px' }}>Class {r.studentClass} Tuition</h3>
                    <span className="badge verified">{r.teachingMode}</span>
                  </div>

                  <div style={{ margin: '8px 0' }}>
                    {[...(r.subjects || [])].map(s => <Chip key={s}>{s}</Chip>)}
                  </div>

                  <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
                    📍 <b>{r.location}</b> · Budget: <b>₹{r.budget?.toLocaleString()}/mo</b><br />
                    🗓 {r.days} · ⏰ {r.preferredTime}
                  </p>

                  <div className="row" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0ec' }}>
                    <button
                      className="button small accent"
                      id={`btn-match-tutors-${r.id}`}
                      onClick={() => setSmartMatchReq(r)}
                    >
                      ⚡ View Smart Matches
                    </button>
                    <small style={{ color: '#888' }}>
                      Posted {new Date(r.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div id="section-applications">
          {applications.length === 0 ? (
            <div className="empty-state">
              <h4>No applications received yet</h4>
              <p>Tutors will apply to your posted requirements soon.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {applications.map(a => (
                <Card key={a.id} id={`app-card-${a.id}`}>
                  <div className="row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar">{a.tutor.fullName[0]}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '17px' }}>{a.tutor.fullName}</h3>
                          <span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#666' }}>
                          Applied for: <b>Class {a.requirement.studentClass}</b> ({[...(a.requirement.subjects || [])].join(', ')})
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {a.status === 'PENDING' && (
                        <>
                          <button
                            className="button small success"
                            id={`btn-accept-app-${a.id}`}
                            onClick={() => handleApplicationStatus(a.id, 'ACCEPTED')}
                          >
                            ✓ Accept Tutor
                          </button>
                          <button
                            className="button small ghost"
                            id={`btn-shortlist-app-${a.id}`}
                            onClick={() => handleApplicationStatus(a.id, 'SHORTLISTED')}
                          >
                            Shortlist
                          </button>
                          <button
                            className="button small danger"
                            id={`btn-reject-app-${a.id}`}
                            onClick={() => handleApplicationStatus(a.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {a.status === 'SHORTLISTED' && (
                        <>
                          <button
                            className="button small success"
                            id={`btn-accept-app-${a.id}`}
                            onClick={() => handleApplicationStatus(a.id, 'ACCEPTED')}
                          >
                            ✓ Accept Tutor
                          </button>
                          <button
                            className="button small danger"
                            id={`btn-reject-app-${a.id}`}
                            onClick={() => handleApplicationStatus(a.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {a.status === 'ACCEPTED' && (
                        <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                          ✓ Active Tuition Created
                        </span>
                      )}
                    </div>
                  </div>

                  {a.message && (
                    <div style={{ background: '#fbfbfa', padding: '10px 14px', borderRadius: '8px', marginTop: '12px', fontSize: '13px', color: '#444' }}>
                      <b>Message:</b> "{a.message}"
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE TUITIONS */}
      {activeTab === 'active' && (
        <div id="section-active-tuitions">
          {activeTuitions.length === 0 ? (
            <div className="empty-state">
              <h4>No active tuitions right now</h4>
              <p>Accept an application from your received applications to start an active tuition.</p>
            </div>
          ) : (
            <div className="grid two">
              {activeTuitions.map(at => (
                <Card key={at.id} id={`active-tuition-card-${at.id}`}>
                  <div className="row">
                    <div>
                      <span className="badge verified">Active Tuition</span>
                      <h3 style={{ fontSize: '18px', marginTop: '6px' }}>
                        Class {at.application?.requirement?.studentClass} with {at.tutor?.fullName}
                      </h3>
                    </div>
                    <div className="avatar">{at.tutor?.fullName[0]}</div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#555', margin: '10px 0', lineHeight: '1.7' }}>
                    📧 Tutor Email: <b>{at.tutor?.email}</b><br />
                    📍 Location: <b>{at.application?.requirement?.location}</b><br />
                    🗓 Schedule: <b>{at.application?.requirement?.days}</b> ({at.application?.requirement?.preferredTime})<br />
                    💵 Monthly Budget: <b>₹{at.application?.requirement?.budget?.toLocaleString()}</b><br />
                    ⏱ Started: <b>{new Date(at.startedAt).toLocaleDateString()}</b>
                  </p>

                  <div className="row" style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f0f0ec' }}>
                    <button
                      className="button small success"
                      id={`btn-complete-tuition-${at.id}`}
                      onClick={() => handleCompleteTuition(at.id)}
                    >
                      ✓ Mark as Completed & Rate
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPLETED & REVIEWS */}
      {activeTab === 'completed' && (
        <div id="section-completed-tuitions">
          {completedTuitions.length === 0 ? (
            <div className="empty-state">
              <h4>No completed tuitions yet</h4>
              <p>Tuitions marked as completed will appear here along with your feedback.</p>
            </div>
          ) : (
            <div className="grid two">
              {completedTuitions.map(ct => (
                <Card key={ct.id}>
                  <div className="row">
                    <div>
                      <span className="badge completed">Completed</span>
                      <h3 style={{ fontSize: '17px', marginTop: '4px' }}>
                        Class {ct.application?.requirement?.studentClass} · {ct.tutor?.fullName}
                      </h3>
                    </div>
                    <div className="avatar">{ct.tutor?.fullName[0]}</div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#666', margin: '8px 0' }}>
                    Completed on: {ct.completedAt ? new Date(ct.completedAt).toLocaleDateString() : 'Recently'}
                  </p>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <button
                      className="button small accent"
                      id={`btn-review-tuition-${ct.id}`}
                      onClick={() => setReviewingTuition(ct)}
                    >
                      ⭐ Write / Update Review
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {smartMatchReq && (
        <SmartMatchModal
          requirement={smartMatchReq}
          onClose={() => setSmartMatchReq(null)}
          onSelectTutor={(t) => setViewingTutor(t)}
        />
      )}

      {viewingTutor && (
        <TutorDetailModal
          tutor={viewingTutor}
          onClose={() => setViewingTutor(null)}
        />
      )}

      {reviewingTuition && (
        <ReviewModal
          activeTuition={reviewingTuition}
          onClose={() => setReviewingTuition(null)}
          onSuccess={() => {
            setReviewingTuition(null);
            loadAll();
          }}
        />
      )}
    </section>
  );
}

// Student / Tutor Dashboard
function TutorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTuitions, setActiveTuitions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    college: '',
    degree: 'B.Tech',
    branch: '',
    studyYear: '3rd Year',
    location: '',
    teachingMode: 'Both',
    availability: '',
    bio: '',
    experienceYears: 1,
    monthlyFee: 3000,
    subjects: 'Mathematics, Science',
    classes: '8th, 9th, 10th',
    languages: 'English, Hindi'
  });

  const loadData = async () => {
    try {
      const [profRes, appsRes, activeRes, revsRes] = await Promise.all([
        api.get('/api/tutors/me').catch(() => null),
        api.get('/api/applications/my'),
        api.get('/api/active-tuitions'),
        api.get(`/api/reviews/tutor/${user.userId}`).catch(() => ({ data: [] }))
      ]);

      if (profRes?.data) {
        setProfile(profRes.data);
        setProfileForm({
          college: profRes.data.college || '',
          degree: profRes.data.degree || 'B.Tech',
          branch: profRes.data.branch || '',
          studyYear: profRes.data.studyYear || '3rd Year',
          location: profRes.data.location || '',
          teachingMode: profRes.data.teachingMode || 'Both',
          availability: profRes.data.availability || '',
          bio: profRes.data.bio || '',
          experienceYears: profRes.data.experienceYears || 1,
          monthlyFee: profRes.data.monthlyFee || 3000,
          subjects: [...(profRes.data.subjects || [])].join(', '),
          classes: [...(profRes.data.classes || [])].join(', '),
          languages: [...(profRes.data.languages || [])].join(', ')
        });
      }

      setApplications(appsRes.data);
      setActiveTuitions(activeRes.data.filter(a => a.status === 'ACTIVE'));
      setReviews(revsRes.data || []);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...profileForm,
        subjects: profileForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
        classes: profileForm.classes.split(',').map(s => s.trim()).filter(Boolean),
        languages: profileForm.languages.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await api.put('/api/tutors/me', payload);
      setProfile(res.data);
      alert('Tutor profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-container" id="tutor-dashboard-page">
      <div className="row">
        <div>
          <p className="eyebrow">TUTOR DASHBOARD</p>
          <h2>Welcome, {user?.name}</h2>
          <p style={{ color: '#666' }}>Track applications, active tuition classes, and student reviews.</p>
        </div>

        {profile?.verificationStatus === 'VERIFIED' ? (
          <span className="badge verified" style={{ padding: '6px 12px', fontSize: '13px' }}>
            ✓ Verified College Tutor
          </span>
        ) : (
          <span className="badge pending" style={{ padding: '6px 12px', fontSize: '13px' }}>
            ⏳ Verification Pending Admin Review
          </span>
        )}
      </div>

      <div className="metrics">
        <div className="metric-card">
          <b>{applications.length}</b>
          <small>Applications Submitted</small>
        </div>
        <div className="metric-card">
          <b>{activeTuitions.length}</b>
          <small>Active Tuitions</small>
        </div>
        <div className="metric-card">
          <b>★ {profile?.rating ? profile.rating.toFixed(1) : 'New'}</b>
          <small>Average Rating</small>
        </div>
        <div className="metric-card">
          <b>{profile?.completedTuitions || 0}</b>
          <small>Completed Tuitions</small>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          id="tab-tutor-applications"
          onClick={() => setActiveTab('applications')}
        >
          My Applications <span className="tab-badge">{applications.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          id="tab-tutor-active"
          onClick={() => setActiveTab('active')}
        >
          Active Tuitions <span className="tab-badge">{activeTuitions.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          id="tab-tutor-profile"
          onClick={() => setActiveTab('profile')}
        >
          Tutor Profile Settings
        </button>
        <button
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          id="tab-tutor-reviews"
          onClick={() => setActiveTab('reviews')}
        >
          Student Reviews <span className="tab-badge">{reviews.length}</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div id="section-tutor-applications">
          {applications.length === 0 ? (
            <div className="empty-state">
              <h4>No applications sent yet</h4>
              <p>Explore tuition requirements posted by families in your neighborhood.</p>
              <Link className="button small accent" to="/find-jobs" style={{ marginTop: '12px' }}>
                Browse Tuition Jobs
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {applications.map(a => (
                <Card key={a.id} id={`tutor-app-card-${a.id}`}>
                  <div className="row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '18px' }}>Class {a.requirement?.studentClass} Tuition</h3>
                        <span className={`badge ${a.status?.toLowerCase()}`}>{a.status}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        📍 {a.requirement?.location} · Budget: <b>₹{a.requirement?.budget?.toLocaleString()}/mo</b> · Mode: {a.requirement?.teachingMode}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <small style={{ color: '#888' }}>
                        Applied {new Date(a.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  {a.message && (
                    <div style={{ background: '#fbfbfa', padding: '10px 14px', borderRadius: '8px', marginTop: '10px', fontSize: '13px', color: '#555' }}>
                      <b>Cover note:</b> "{a.message}"
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE TUITIONS */}
      {activeTab === 'active' && (
        <div id="section-tutor-active-tuitions">
          {activeTuitions.length === 0 ? (
            <div className="empty-state">
              <h4>No active tuitions</h4>
              <p>When a parent accepts your application, it will appear here as an ongoing tuition class.</p>
            </div>
          ) : (
            <div className="grid two">
              {activeTuitions.map(at => (
                <Card key={at.id}>
                  <div className="row">
                    <span className="badge verified">Active Engagement</span>
                    <small style={{ color: '#888' }}>Started {new Date(at.startedAt).toLocaleDateString()}</small>
                  </div>
                  <h3 style={{ fontSize: '18px', margin: '8px 0' }}>
                    Class {at.application?.requirement?.studentClass} for {at.parent?.fullName}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.7' }}>
                    📍 Location: <b>{at.application?.requirement?.location}</b><br />
                    🗓 Schedule: <b>{at.application?.requirement?.days}</b> ({at.application?.requirement?.preferredTime})<br />
                    💵 Fee: <b>₹{at.application?.requirement?.budget?.toLocaleString()}/month</b><br />
                    📧 Parent Email: <b>{at.parent?.email}</b>
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div id="section-tutor-profile">
          <Card>
            <h3 style={{ marginBottom: '16px' }}>Edit Tutor Credentials & Preferences</h3>
            <form onSubmit={saveProfile} className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label>College / University</label>
                  <input
                    id="tutor-college"
                    value={profileForm.college}
                    onChange={e => setProfileForm({ ...profileForm, college: e.target.value })}
                    placeholder="e.g. JNTU Hyderabad"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    id="tutor-degree"
                    value={profileForm.degree}
                    onChange={e => setProfileForm({ ...profileForm, degree: e.target.value })}
                    placeholder="e.g. B.Tech / B.Sc"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Branch / Major</label>
                  <input
                    id="tutor-branch"
                    value={profileForm.branch}
                    onChange={e => setProfileForm({ ...profileForm, branch: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>
                <div className="form-group">
                  <label>Year of Study</label>
                  <input
                    id="tutor-year"
                    value={profileForm.studyYear}
                    onChange={e => setProfileForm({ ...profileForm, studyYear: e.target.value })}
                    placeholder="e.g. 3rd Year"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Locality / City</label>
                  <input
                    id="tutor-location"
                    value={profileForm.location}
                    onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                    placeholder="e.g. Hyderabad"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teaching Mode</label>
                  <select
                    id="tutor-teaching-mode"
                    value={profileForm.teachingMode}
                    onChange={e => setProfileForm({ ...profileForm, teachingMode: e.target.value })}
                  >
                    <option value="Both">Both (Online & In-Person)</option>
                    <option value="Online">Online Only</option>
                    <option value="Offline">Offline / Home Only</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expected Monthly Fee (₹)</label>
                  <input
                    id="tutor-fee"
                    type="number"
                    value={profileForm.monthlyFee}
                    onChange={e => setProfileForm({ ...profileForm, monthlyFee: +e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    id="tutor-experience"
                    type="number"
                    value={profileForm.experienceYears}
                    onChange={e => setProfileForm({ ...profileForm, experienceYears: +e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subjects Taught (Comma-separated)</label>
                <input
                  id="tutor-subjects"
                  value={profileForm.subjects}
                  onChange={e => setProfileForm({ ...profileForm, subjects: e.target.value })}
                  placeholder="Mathematics, Physics, Computer Science"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Student Classes</label>
                  <input
                    id="tutor-classes"
                    value={profileForm.classes}
                    onChange={e => setProfileForm({ ...profileForm, classes: e.target.value })}
                    placeholder="8th, 9th, 10th, 11th"
                  />
                </div>
                <div className="form-group">
                  <label>Languages Spoken</label>
                  <input
                    id="tutor-languages"
                    value={profileForm.languages}
                    onChange={e => setProfileForm({ ...profileForm, languages: e.target.value })}
                    placeholder="English, Hindi, Telugu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Weekly Availability</label>
                <input
                  id="tutor-availability"
                  value={profileForm.availability}
                  onChange={e => setProfileForm({ ...profileForm, availability: e.target.value })}
                  placeholder="e.g. Weekdays 5 PM - 8 PM, Weekends flexible"
                />
              </div>

              <div className="form-group">
                <label>Bio & Teaching Philosophy</label>
                <textarea
                  id="tutor-bio"
                  rows="3"
                  value={profileForm.bio}
                  onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell parents about your approach, previous tutoring results, and passion for mentoring."
                />
              </div>

              <button className="button accent" id="btn-save-tutor-profile" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 4: REVIEWS */}
      {activeTab === 'reviews' && (
        <div id="section-tutor-reviews">
          {reviews.length === 0 ? (
            <div className="empty-state">
              <h4>No reviews yet</h4>
              <p>Complete active tuitions with families to receive verified ratings and reviews.</p>
            </div>
          ) : (
            <div className="grid two">
              {reviews.map(rev => (
                <Card key={rev.id}>
                  <div className="row">
                    <StarRating rating={rev.rating} readOnly />
                    <small style={{ color: '#888' }}>{new Date(rev.createdAt).toLocaleDateString()}</small>
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>
                    "{rev.text}"
                  </p>
                  <small style={{ display: 'block', marginTop: '6px', color: '#777' }}>
                    — {rev.parent?.fullName} ({rev.activeTuition?.application?.requirement?.studentClass} Class)
                  </small>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Admin Portal
function AdminPortal() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('tutors');

  const loadAdminData = async () => {
    try {
      const [statsRes, tutorsRes, usersRes] = await Promise.all([
        api.get('/api/admin/statistics'),
        api.get('/api/admin/tutors'),
        api.get('/api/admin/users')
      ]);
      setStats(statsRes.data);
      setTutors(tutorsRes.data);
      setUsers(usersRes.data);
    } catch {}
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerification = async (tutorId, status) => {
    try {
      await api.put(`/api/admin/verification/${tutorId}`, { status });
      alert(`Tutor verification updated to ${status}.`);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update verification');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <section className="page-container">
        <div className="alert error">Access restricted. Admin credentials required.</div>
      </section>
    );
  }

  return (
    <section className="page-container" id="admin-portal-page">
      <p className="eyebrow">ADMINISTRATION</p>
      <h2>Marketplace Overview & Verification</h2>

      {stats && (
        <div className="metrics" id="admin-stats">
          <div className="metric-card">
            <b>{stats.parents}</b>
            <small>Registered Parents</small>
          </div>
          <div className="metric-card">
            <b>{stats.students}</b>
            <small>Registered Students</small>
          </div>
          <div className="metric-card">
            <b>{stats.requirements}</b>
            <small>Active Requirements</small>
          </div>
          <div className="metric-card">
            <b>{stats.applications}</b>
            <small>Total Applications</small>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'tutors' ? 'active' : ''}`}
          id="tab-admin-tutors"
          onClick={() => setActiveTab('tutors')}
        >
          Tutor Verification Queue <span className="tab-badge">{tutors.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          id="tab-admin-users"
          onClick={() => setActiveTab('users')}
        >
          All Users <span className="tab-badge">{users.length}</span>
        </button>
      </div>

      {activeTab === 'tutors' && (
        <Card id="admin-tutors-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tutor</th>
                <th>College / Degree</th>
                <th>Location</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tutors.map(t => (
                <tr key={t.id} id={`admin-tutor-row-${t.id}`}>
                  <td>
                    <b>{t.user?.fullName}</b>
                    <small style={{ display: 'block', color: '#777' }}>{t.user?.email}</small>
                  </td>
                  <td>{t.degree} ({t.branch})<br /><small>{t.college}</small></td>
                  <td>{t.location}</td>
                  <td>₹{t.monthlyFee?.toLocaleString()}/mo</td>
                  <td>
                    <span className={`badge ${t.verificationStatus?.toLowerCase()}`}>
                      {t.verificationStatus}
                    </span>
                  </td>
                  <td>
                    {t.verificationStatus !== 'VERIFIED' ? (
                      <button
                        className="button tiny success"
                        id={`btn-verify-tutor-${t.id}`}
                        onClick={() => handleVerification(t.id, 'VERIFIED')}
                      >
                        ✓ Verify
                      </button>
                    ) : (
                      <button
                        className="button tiny ghost"
                        id={`btn-revoke-tutor-${t.id}`}
                        onClick={() => handleVerification(t.id, 'PENDING')}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card id="admin-users-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Location</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><b>{u.fullName}</b></td>
                  <td>{u.email}</td>
                  <td><span className="badge info">{u.role}</span></td>
                  <td>{u.location || '—'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}

// Router App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/find-tutor" element={<Tutors />} />
            <Route path="/find-jobs" element={<Jobs />} />
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/post-tuition" element={<PostTuition />} />
            <Route path="/student/dashboard" element={<TutorDashboard />} />
            <Route path="/admin" element={<AdminPortal />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
