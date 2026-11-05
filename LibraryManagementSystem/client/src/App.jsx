import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_KEY = 'lms_master_key_live_9948271635882';

export default function App() {
  const canvasRef = useRef(null);
  const [token, setToken] = useState(() => localStorage.getItem('lms_jwt'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_user'));
    } catch {
      return null;
    }
  });

  // App Workspace State
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'loans' | 'about' | 'profile' | 'staff' | 'security'
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [myLoans, setMyLoans] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [apiKeysList, setApiKeysList] = useState([]);
  const [stats, setStats] = useState({ titles: 6, available: 14, borrowed: 5, members: 4 });

  // Auth Form State (Public Portal)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [guestTab, setGuestTab] = useState('login'); // 'login' | 'catalog' | 'about' | 'security'
  const [authEmail, setAuthEmail] = useState('admin@library.com');
  const [authPassword, setAuthPassword] = useState('Admin@123');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('member');

  // Book Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState('');
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    categoryId: '',
    publishedYear: 2024,
    totalCopies: 4,
    location: '',
    description: ''
  });

  // Staff & Profile
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyTier, setNewKeyTier] = useState('standard');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const api = async (endpoint, method = 'GET', body = null) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(targetUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Action failed');
    }
    return data;
  };

  const loadData = async () => {
    try {
      const [h, bStats, cats, bks] = await Promise.all([
        api('/api/v1/health'),
        api('/api/v1/books/stats'),
        api('/api/v1/categories'),
        api('/api/v1/books?limit=100')
      ]);

      setStats({
        titles: h.data.counts.books,
        available: bStats.data.availableCopies,
        borrowed: h.data.counts.activeLoans,
        members: h.data.counts.users
      });
      setCategories(cats.data);
      setBooks(bks.data);

      if (cats.data.length > 0 && !bookForm.categoryId) {
        setBookForm(prev => ({ ...prev, categoryId: cats.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyLoans = async () => {
    if (!token) return;
    try {
      const res = await api('/api/v1/borrowings/my');
      setMyLoans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStaffData = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'librarian')) return;
    try {
      const uRes = await api('/api/v1/users');
      setUsersList(uRes.data);
      if (user.role === 'admin') {
        const kRes = await api('/api/v1/keys');
        setApiKeysList(kRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    if (token) loadMyLoans();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'staff') loadStaffData();
  }, [activeTab]);

  // Background Knowledge Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    let particles = [];
    const particleColors = [
      'rgba(82, 183, 136, ',   // Forest accent
      'rgba(212, 163, 115, ',  // Sand gold
      'rgba(176, 38, 255, ',   // Electric purple
      'rgba(52, 211, 153, '    // Emerald bright
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particleCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 22000), 55);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        radius: Math.random() * 2 + 1,
        colorBase: particleColors[Math.floor(Math.random() * particleColors.length)],
        baseAlpha: Math.random() * 0.38 + 0.22,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onMouseOut = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseOut);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const dxM = mouse.x - p.x;
        const dyM = mouse.y - p.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM < 120) {
          p.x -= (dxM / distM) * 0.75;
          p.y -= (dyM / distM) * 0.75;
        }

        const currentAlpha = p.baseAlpha + Math.sin(p.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.colorBase + currentAlpha + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.colorBase + '0.7)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(176, 38, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Direct login execution
  const directLogin = async (email, password) => {
    setAuthEmail(email);
    setAuthPassword(password);
    try {
      notify(`Authenticating ${email}...`, 'info');
      const res = await api('/api/v1/auth/login', 'POST', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('lms_jwt', res.data.token);
      localStorage.setItem('lms_user', JSON.stringify(res.data.user));
      notify(`Welcome back, ${res.data.user.name}! Entering library workspace...`, 'success');
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const selectDemoRole = (role) => {
    const creds = {
      admin: { email: 'admin@library.com', pass: 'Admin@123' },
      librarian: { email: 'librarian@library.com', pass: 'Librarian@123' },
      member: { email: 'john.doe@example.com', pass: 'Member@123' }
    };
    const c = creds[role] || creds.admin;
    setAuthEmail(c.email);
    setAuthPassword(c.pass);
    directLogin(c.email, c.pass);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      const email = authEmail || 'admin@library.com';
      const pass = authPassword || 'Admin@123';
      await directLogin(email, pass);
    } else {
      try {
        const res = await api('/api/v1/auth/register', 'POST', {
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole
        });
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('lms_jwt', res.data.token);
        localStorage.setItem('lms_user', JSON.stringify(res.data.user));
        notify(`Account created! Welcome to Athena Library, ${res.data.user.name}.`, 'success');
        loadData();
      } catch (err) {
        notify(err.message, 'error');
      }
    }
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lms_jwt');
    localStorage.removeItem('lms_user');
    notify('You have signed out of the library.', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBorrow = async (bookId) => {
    if (!token) {
      notify('Please sign in to loan books to your patron account.', 'info');
      return;
    }
    try {
      const res = await api('/api/v1/borrowings/borrow', 'POST', { bookId });
      notify(`Book borrowed! Due date: ${new Date(res.data.dueDate).toLocaleDateString()}`, 'success');
      loadData();
      loadMyLoans();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleReturn = async (borrowingId) => {
    try {
      const res = await api('/api/v1/borrowings/return', 'POST', { borrowingId });
      notify(`Book returned! ${res.data.fineAmount > 0 ? `Late fine: $${res.data.fineAmount.toFixed(2)}` : 'Restocked immediately.'}`, 'success');
      loadData();
      loadMyLoans();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api('/api/v1/auth/change-password', 'POST', { oldPassword, newPassword });
      notify('Password updated! Salted Bcrypt verified.', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBookId) {
        await api(`/api/v1/books/${editingBookId}`, 'PUT', bookForm);
        notify('Publication updated successfully!', 'success');
      } else {
        await api('/api/v1/books', 'POST', bookForm);
        notify('New publication added to catalog!', 'success');
      }
      setShowBookModal(false);
      setEditingBookId('');
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    try {
      await api(`/api/v1/books/${id}`, 'DELETE');
      notify('Publication removed.', 'info');
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return notify('Enter a client name.', 'error');
    try {
      const res = await api('/api/v1/keys', 'POST', { name: newKeyName, tier: newKeyTier });
      notify(`API Key created: ${res.data.key}`, 'success');
      setNewKeyName('');
      loadStaffData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Revoke this API Key?')) return;
    try {
      await api(`/api/v1/keys/${id}`, 'DELETE');
      notify('API Key revoked.', 'info');
      loadStaffData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Filtered books
  const filteredBooks = books.filter(b => {
    const matchCat = !selectedCategory || b.categoryId === selectedCategory;
    const matchQ = !search || 
      b.title.toLowerCase().includes(search.toLowerCase()) || 
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  }).sort((a, b) => {
    if (sortOption === 'title-asc') return a.title.localeCompare(b.title);
    if (sortOption === 'year-desc') return b.publishedYear - a.publishedYear;
    if (sortOption === 'copies-desc') return b.availableCopies - a.availableCopies;
    return 0;
  });

  const isStaff = user && (user.role === 'admin' || user.role === 'librarian');
  const userInitials = user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD';

  return (
    <div className="app-root">
      {/* Interactive Dynamic Knowledge Mesh Canvas */}
      <canvas ref={canvasRef} className="ambient-canvas" />

      {/* Multi-Layer Animated Aurora Orbs */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
      <div className="aurora-orb aurora-orb-4" />

      {/* Ambient Cyber Scanline Grid Overlay */}
      <div className="ambient-grid-overlay" />
      <div className="ambient-scanline" />

      {/* Main Navigation Header */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-logo" onClick={() => { if (user) setActiveTab('catalog'); else setGuestTab('login'); }}>
            <div className="brand-icon">📚</div>
            <div>
              <span className="brand-name">Athena LibraryOS</span>
              <span className="brand-tag">Cloud Library</span>
            </div>
          </div>

          {user ? (
            <nav className="nav-links">
              <button type="button" onClick={() => setActiveTab('catalog')} className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}>📚 Catalog</button>
              <button type="button" onClick={() => setActiveTab('loans')} className={`nav-btn ${activeTab === 'loans' ? 'active' : ''}`}>📋 My Loans</button>
              <button type="button" onClick={() => setActiveTab('about')} className={`nav-btn ${activeTab === 'about' ? 'active' : ''}`}>🏛️ About</button>
              <button type="button" onClick={() => setActiveTab('profile')} className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}>🪪 Patron Card</button>
              {isStaff && (
                <button type="button" onClick={() => setActiveTab('staff')} className={`nav-btn ${activeTab === 'staff' ? 'active' : ''}`}>⚙️ Staff Studio</button>
              )}
              <button type="button" onClick={() => setActiveTab('security')} className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}>🔒 Security</button>
            </nav>
          ) : (
            <nav className="nav-links">
              <button type="button" onClick={() => setGuestTab('login')} className={`nav-btn ${guestTab === 'login' ? 'active' : ''}`}>🔑 Sign In</button>
              <button type="button" onClick={() => setGuestTab('catalog')} className={`nav-btn ${guestTab === 'catalog' ? 'active' : ''}`}>📚 Catalog</button>
              <button type="button" onClick={() => setGuestTab('about')} className={`nav-btn ${guestTab === 'about' ? 'active' : ''}`}>🏛️ Campus & About</button>
              <button type="button" onClick={() => setGuestTab('security')} className={`nav-btn ${guestTab === 'security' ? 'active' : ''}`}>🔒 Security Specs</button>
            </nav>
          )}

          <div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--forest-800)', border: '1px solid var(--sand-border)', borderRadius: '9999px', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '9999px', background: 'var(--purple-electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#ffffff' }}>
                    {userInitials}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sand-50)' }}>{user.name}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--purple-bg)', color: 'var(--purple-electric)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                    {user.role}
                  </span>
                </div>
                <button type="button" onClick={handleSignOut} className="btn btn-rose btn-sm" title="Sign Out">🚪 Sign Out</button>
              </div>
            ) : (
              <button type="button" onClick={() => { setGuestTab('login'); const el = document.getElementById('authPortalSection'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="btn btn-purple btn-sm">🔐 Sign In</button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
           VIEW 1: PUBLIC HOMEPAGE & LOGIN (WHEN NOT LOGGED IN — LIBIB STYLE)
           ========================================================================= */}
      {!user && (
        <main className="page-container">
          <div className="public-hero">
            <div className="public-badge">
              <span>🏛️ Academic Cloud Library & Cataloging Platform</span>
            </div>
            <h1 className="public-title">
              Catalog, Circulate & Discover <span>Knowledge in the Cloud</span>
            </h1>
            <p className="public-subtitle">
              A sanctuary for research, technology, and literature. Manage campus circulation, reserve academic publications, and access your digital patron profile with zero friction.
            </p>
          </div>

          {/* DEDICATED SIGN IN & REGISTRATION PORTAL */}
          <div className="auth-portal-card" id="authPortalSection">
            <div className="auth-portal-header">
              <div className="auth-portal-icon">📚</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>
                {authMode === 'login' ? 'Sign In to Your Library' : 'Create Patron Account'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.25rem' }}>
                Enter patron credentials to enter the library workspace
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="auth-tabs">
              <button type="button" className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Sign In</button>
              <button type="button" className={`auth-tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>Create Patron Account</button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} required className="form-input" placeholder="e.g. Johnathan Doe" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="form-input" placeholder="patron@library.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="form-input" placeholder="••••••••" />
              </div>

              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Patron Role *</label>
                  <select value={authRole} onChange={e => setAuthRole(e.target.value)} className="form-select">
                    <option value="member">Member (Patron)</option>
                    <option value="librarian">Librarian (Staff)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-purple" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                {authMode === 'login' ? 'Sign In & Open Library' : 'Register & Open Library'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--sand-400)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>Default Admin: <code style={{ color: 'var(--sand-gold)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>admin@library.com</code> / <code style={{ color: 'var(--sand-gold)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Admin@123</code></div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>🔒 Cryptographic Security: <strong>HS256 JWT</strong> &bull; <strong>10-round salted Bcrypt</strong></div>
            </div>
          </div>

          {/* LIBIB-STYLE FEATURE SHOWCASE */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sand-50)' }}>Built for Academic Collections & Students</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--sand-300)', marginTop: '0.3rem' }}>Intuitive cataloging, barcode/ISBN search, and smart circulation.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Fast Cataloging & Real-Time Stock</h3>
              <p className="feature-text">Search by Title, Author, or ISBN with immediate availability indicators, category filtering, and shelf location codes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3 className="feature-title">Smart 14-Day Circulation</h3>
              <p className="feature-text">Automatic 14-day checkout windows, fine calculations ($0.50/day policy), and 1-click inventory replenishment on return.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🪪</div>
              <h3 className="feature-title">Holographic Patron Cards</h3>
              <p className="feature-text">Digital membership cards for university patrons featuring verified identification, member tiers, and password management.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Enterprise Security & RBAC</h3>
              <p className="feature-text">3-Tier role authorization (Admin, Librarian, Member) with dual TLS 1.3 ports (8000 & 8443) and API Key verification.</p>
            </div>
          </div>

          {/* CAMPUS GUIDE & FACILITIES */}
          <div className="feature-card" id="campusAboutSection" style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sand-border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>Campus Facilities & Lending Regulations</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.2rem' }}>Central Academic Campus Wing &bull; Founded 1984</p>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-200)', background: 'var(--emerald-bg)', padding: '0.3rem 0.8rem', borderRadius: '9999px' }}>
                ● Open Today: 08:00 AM – 09:00 PM
              </div>
            </div>

            <div className="grid-2">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sand-50)', marginBottom: '0.75rem' }}>Operating Hours</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--sand-border)' }}>
                    <span style={{ color: 'var(--sand-400)' }}>Monday – Thursday</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--sand-100)' }}>08:00 AM – 10:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--sand-border)' }}>
                    <span style={{ color: 'var(--sand-400)' }}>Friday</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--sand-100)' }}>08:00 AM – 08:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--sand-border)' }}>
                    <span style={{ color: 'var(--sand-400)' }}>Saturday</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--sand-100)' }}>10:00 AM – 06:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sand-400)' }}>Sunday</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--amber)' }}>12:00 PM – 05:00 PM</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sand-50)', marginBottom: '0.75rem' }}>Circulation Regulations</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--sand-200)' }}>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--forest-300)', fontWeight: 800 }}>✓</span>
                    <span><strong>14-Day Lending Period:</strong> Standard loan duration for all academic books.</span>
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--forest-300)', fontWeight: 800 }}>✓</span>
                    <span><strong>Max 5 Active Loans:</strong> Patrons may carry up to 5 concurrent loans.</span>
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 800 }}>✓</span>
                    <span><strong>Late Return Policy:</strong> Overdue fines accrue at <strong>$0.50/day</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================================
           VIEW 2: INTERNAL DIGITAL LIBRARY WORKSPACE (AFTER SIGNING IN)
           ========================================================================= */}
      {user && (
        <main className="page-container">
          {/* KPI STATS RIBBON */}
          <div className="app-ribbon">
            <div className="ribbon-stats">
              <div className="ribbon-stat-item">
                <span className="ribbon-stat-val">{stats.titles}</span>
                <span className="ribbon-stat-lbl">📚 Total Titles</span>
              </div>
              <div className="ribbon-stat-item">
                <span className="ribbon-stat-val" style={{ color: 'var(--forest-200)' }}>{stats.available}</span>
                <span className="ribbon-stat-lbl">✅ Available Copies</span>
              </div>
              <div className="ribbon-stat-item">
                <span className="ribbon-stat-val" style={{ color: 'var(--amber)' }}>{stats.borrowed}</span>
                <span className="ribbon-stat-lbl">⏳ Active Borrowings</span>
              </div>
              <div className="ribbon-stat-item">
                <span className="ribbon-stat-val" style={{ color: 'var(--purple-electric)' }}>{stats.members}</span>
                <span className="ribbon-stat-lbl">👥 Patrons</span>
              </div>
            </div>

            {isStaff && (
              <button onClick={() => { setEditingBookId(''); setBookForm({ title: '', author: '', isbn: '', categoryId: categories[0]?.id || '', publishedYear: 2024, totalCopies: 4, location: '', description: '' }); setShowBookModal(true); }} className="btn btn-purple btn-sm">
                + Add New Book
              </button>
            )}
          </div>

          {/* TAB 1: CATALOG */}
          {activeTab === 'catalog' && (
            <section>
              <div className="catalog-controls">
                <div className="search-row">
                  <div className="search-input-wrap">
                    <span className="search-icon">🔍</span>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter collection by Title, Author, or ISBN..." className="catalog-search-input" />
                  </div>
                  <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="form-select" style={{ width: 'auto' }}>
                    <option value="default">Sort by: Default</option>
                    <option value="title-asc">Title: A to Z</option>
                    <option value="year-desc">Published: Newest</option>
                    <option value="copies-desc">Most Available</option>
                  </select>
                </div>

                <div className="genre-chips">
                  <button onClick={() => setSelectedCategory('')} className={`chip ${!selectedCategory ? 'active' : ''}`}>All Genres</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`chip ${selectedCategory === c.id ? 'active' : ''}`}>{c.name}</button>
                  ))}
                </div>
              </div>

              <div className="books-grid">
                {filteredBooks.map(b => {
                  const isAvailable = b.availableCopies > 0;
                  return (
                    <div key={b.id} className="book-card">
                      <div className="book-tile-cover">
                        <div style={{ maxWidth: '80%' }}>
                          <div className="book-tile-title">{b.title}</div>
                          <div className="book-tile-author">by {b.author}</div>
                        </div>
                        <div className="book-tile-icon">📖</div>
                      </div>

                      <div className="book-meta">
                        <span className="book-cat-badge">{b.categoryName || 'General'}</span>
                        <span className={`stock-badge ${isAvailable ? 'stock-available' : 'stock-out'}`}>
                          <span className="stock-dot"></span>
                          <span>{isAvailable ? `${b.availableCopies} of ${b.totalCopies} Available` : 'Checked Out'}</span>
                        </span>
                      </div>

                      <p className="book-desc">{b.description || 'Archived academic publication in University library collection.'}</p>

                      <div className="book-specs">
                        <span>ISBN: {b.isbn}</span>
                        <span>{b.location || 'Shelf CS-01'}</span>
                      </div>

                      <div className="book-actions">
                        <button onClick={() => handleBorrow(b.id)} disabled={!isAvailable} className="btn btn-purple btn-sm" style={{ flex: 1 }}>
                          {isAvailable ? '⚡ Borrow / Check Out' : 'All Checked Out'}
                        </button>
                        {isStaff && (
                          <>
                            <button onClick={() => { setEditingBookId(b.id); setBookForm({ title: b.title, author: b.author, isbn: b.isbn, categoryId: b.categoryId, publishedYear: b.publishedYear, totalCopies: b.totalCopies, location: b.location || '', description: b.description || '' }); setShowBookModal(true); }} className="btn btn-sand btn-sm">Edit</button>
                            <button onClick={() => handleDeleteBook(b.id)} className="btn btn-rose btn-sm">Del</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 2: MY LOANS */}
          {activeTab === 'loans' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>My Active Borrowings & Circulation</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.2rem' }}>Review return deadlines, calculate overdue fines, and return copies to the shelf.</p>
                </div>
                <button onClick={loadMyLoans} className="btn btn-sand btn-sm">🔄 Refresh Loans</button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Publication Title</th>
                      <th>Borrow Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Accrued Fine</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLoans.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--sand-400)', padding: '3rem' }}>
                          No active loans found. Browse the catalog to borrow books!
                        </td>
                      </tr>
                    ) : (
                      myLoans.map(loan => {
                        const isOverdue = loan.status === 'overdue' || (new Date(loan.dueDate) < new Date() && loan.status === 'borrowed');
                        const isReturned = loan.status === 'returned';
                        return (
                          <tr key={loan.id}>
                            <td style={{ fontWeight: 700, color: 'var(--sand-50)' }}>{loan.bookTitle || `Book ${loan.bookId}`}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--sand-300)' }}>{new Date(loan.borrowDate).toLocaleDateString()}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: isOverdue ? 'var(--rose)' : 'var(--sand-100)' }}>{new Date(loan.dueDate).toLocaleDateString()}</td>
                            <td>
                              <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', background: isReturned ? 'var(--emerald-bg)' : isOverdue ? 'var(--rose-bg)' : 'var(--purple-bg)', color: isReturned ? 'var(--forest-200)' : isOverdue ? 'var(--rose)' : 'var(--purple-electric)' }}>
                                {loan.status}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: loan.fineAmount > 0 ? 'var(--rose)' : 'var(--forest-200)' }}>
                              ${(loan.fineAmount || 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {!isReturned ? (
                                <button onClick={() => handleReturn(loan.id)} className="btn btn-sand btn-sm">Return Book</button>
                              ) : (
                                <span style={{ color: 'var(--forest-200)', fontSize: '0.75rem', fontWeight: 700 }}>Returned</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: ABOUT */}
          {activeTab === 'about' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>Campus Library Guide & Wings</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.2rem' }}>Physical stacks, study cubicles, computing facilities, and circulation guidelines.</p>
              </div>

              <div className="grid-3">
                <div className="feature-card">
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>💻</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sand-50)' }}>Level 2 STEM & Coding Lab</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', lineHeight: 1.6 }}>
                    60 high-speed dual-display workstations, direct repository access to IEEE Xplore, ACM Digital Library, and SpringerLink journals.
                  </p>
                </div>

                <div className="feature-card">
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🤫</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sand-50)' }}>Level 3 Silent Carrels</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', lineHeight: 1.6 }}>
                    Acoustically isolated private pods for deep focus, thesis writing, manuscript examination, and quiet research.
                  </p>
                </div>

                <div className="feature-card">
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>☕</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sand-50)' }}>Level 1 Circulation & Media</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', lineHeight: 1.6 }}>
                    Main information desk, book returns kiosk, study tables, campus coffee counter, and new arrivals display shelves.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: PATRON CARD */}
          {activeTab === 'profile' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>Patron Digital ID & Account Hub</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.2rem' }}>Review your holographic membership card, active JWT token, and update password.</p>
              </div>

              <div className="grid-2" style={{ alignItems: 'start' }}>
                <div className="holo-card">
                  <div className="holo-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📚</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--sand-200)' }}>ATHENA CENTRAL LIBRARY</span>
                    </div>
                    <div className="holo-chip"></div>
                  </div>

                  <div className="holo-body">
                    <div className="holo-name">{user.name}</div>
                    <div className="holo-email">{user.email}</div>
                    <div style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--purple-bg)', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--sand-50)' }}>
                      {user.role}
                    </div>
                  </div>

                  <div className="holo-footer">
                    <div>
                      <span style={{ color: 'var(--sand-400)', fontSize: '0.65rem', display: 'block' }}>PATRON ID</span>
                      <span style={{ color: 'var(--sand-50)', fontWeight: 700 }}>ID: {user.id.toUpperCase()}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--sand-400)', fontSize: '0.65rem', display: 'block' }}>STATUS</span>
                      <span style={{ color: 'var(--forest-200)', fontWeight: 700 }}>● Verified Active</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="feature-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sand-50)', marginBottom: '0.5rem' }}>Change Password (Bcrypt Salted)</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--sand-300)', marginBottom: '1rem' }}>Update your account password with 10 salt rounds:</p>
                    <form onSubmit={handlePasswordChange}>
                      <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="form-input" placeholder="••••••••" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">New Password (min 8 chars, 1 uppercase, 1 digit)</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="form-input" placeholder="••••••••" />
                      </div>
                      <button type="submit" className="btn btn-purple btn-sm">Update Password</button>
                    </form>
                  </div>

                  <div className="feature-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sand-50)' }}>Active Signed JWT Bearer Token</h4>
                      <button onClick={() => { navigator.clipboard.writeText(token); notify('JWT Token copied!', 'success'); }} className="btn btn-sand btn-sm" style={{ fontSize: '0.72rem' }}>Copy Token</button>
                    </div>
                    <div style={{ background: 'var(--forest-950)', border: '1px solid var(--sand-border)', borderRadius: '0.5rem', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--sand-200)', wordBreak: 'break-all', maxHeight: 80, overflowY: 'auto' }}>
                      {token}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: STAFF STUDIO */}
          {activeTab === 'staff' && isStaff && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>Staff Operations & Admin Studio</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.2rem' }}>Oversee patron directory, inventory, and developer API key access.</p>
                </div>
                <button onClick={() => { setEditingBookId(''); setBookForm({ title: '', author: '', isbn: '', categoryId: categories[0]?.id || '', publishedYear: 2024, totalCopies: 4, location: '', description: '' }); setShowBookModal(true); }} className="btn btn-purple btn-sm">
                  + New Publication
                </button>
              </div>

              <div className="grid-2">
                <div className="feature-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sand-50)', marginBottom: '0.75rem' }}>Enrolled Patrons & Staff</h3>
                  <div className="table-container" style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 0 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Patron</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--sand-50)' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--sand-400)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--purple-bg)', color: 'var(--purple-electric)', padding: '0.15rem 0.5rem', borderRadius: '0.35rem' }}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: 'var(--forest-200)', fontWeight: 700, fontSize: '0.75rem' }}>● {u.status || 'Active'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="feature-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sand-50)', marginBottom: '0.5rem' }}>API Key Gateway Console</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Client Name (e.g. Mobile App)" className="form-input" style={{ flex: 1 }} />
                    <select value={newKeyTier} onChange={e => setNewKeyTier(e.target.value)} className="form-select" style={{ width: 'auto' }}>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={handleCreateKey} className="btn btn-purple btn-sm">Create</button>
                  </div>
                  <div className="table-container" style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 0 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Key</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeysList.map(k => (
                          <tr key={k.id}>
                            <td style={{ fontWeight: 700, color: 'var(--sand-50)' }}>{k.name}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--purple-electric)' }}>{k.key ? k.key.substring(0, 16) + '...' : 'lms_key_...'}</td>
                            <td>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: k.status === 'active' ? 'var(--forest-200)' : 'var(--rose)' }}>
                                ● {k.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {k.status === 'active' ? (
                                <button onClick={() => handleRevokeKey(k.id)} className="btn btn-rose btn-sm" style={{ fontSize: '0.7rem' }}>Revoke</button>
                              ) : (
                                <span style={{ color: 'var(--sand-400)', fontSize: '0.7rem' }}>Revoked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === 'security' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sand-50)' }}>Enterprise Security Architecture</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--sand-300)', marginTop: '0.2rem' }}>Multi-layered security across transport, application, and persistence layers.</p>
                </div>
                <a href="/api/v1/health" target="_blank" rel="noreferrer" className="btn btn-sand btn-sm">View Health API ↗</a>
              </div>

              <div className="feature-grid">
                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sand-50)' }}>Dual HTTPS & TLSv1.3</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sand-300)', lineHeight: 1.6, marginTop: '0.3rem' }}>
                    Dual server on ports 8000 and 8443 with TLS 1.2+ minimum, modern cipher suites, and auto-generated X.509 certificates.
                  </p>
                </div>

                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔑</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sand-50)' }}>API Key Gateway</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sand-300)', lineHeight: 1.6, marginTop: '0.3rem' }}>
                    Protected routes mandate <code style={{ color: 'var(--purple-electric)' }}>x-api-key</code> validation with active and revocation checks.
                  </p>
                </div>

                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sand-50)' }}>3-Tier RBAC & JWT</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sand-300)', lineHeight: 1.6, marginTop: '0.3rem' }}>
                    Cryptographically signed HS256 tokens enforcing granular Admin, Librarian, and Member authorization.
                  </p>
                </div>

                <div className="feature-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sand-50)' }}>Bcrypt & Zod Validation</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sand-300)', lineHeight: 1.6, marginTop: '0.3rem' }}>
                    10 salt rounds for password hashing. Strict declarative Zod input validation on all parameters.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* Book Add/Edit Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sand-50)' }}>
                {editingBookId ? 'Edit Publication' : 'Add New Publication'}
              </h3>
              <button onClick={() => setShowBookModal(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveBook}>
              <div className="form-group">
                <label className="form-label">Publication Title *</label>
                <input type="text" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required className="form-input" placeholder="e.g. Clean Architecture" />
              </div>

              <div className="form-group">
                <label className="form-label">Author Name *</label>
                <input type="text" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} required className="form-input" placeholder="e.g. Robert C. Martin" />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">ISBN Code *</label>
                  <input type="text" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} required className="form-input" placeholder="978-0134494166" />
                </div>
                <div className="form-group">
                  <label className="form-label">Published Year *</label>
                  <input type="number" value={bookForm.publishedYear} onChange={e => setBookForm({ ...bookForm, publishedYear: parseInt(e.target.value, 10) })} required className="form-input" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Genre Category *</label>
                  <select value={bookForm.categoryId} onChange={e => setBookForm({ ...bookForm, categoryId: e.target.value })} className="form-select">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Copies *</label>
                  <input type="number" min="1" value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value, 10) })} required className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Shelf Location</label>
                <input type="text" value={bookForm.location} onChange={e => setBookForm({ ...bookForm, location: e.target.value })} className="form-input" placeholder="e.g. Shelf CS-04" />
              </div>

              <div className="form-group">
                <label className="form-label">Synopsis / Description</label>
                <textarea rows="3" value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} className="form-input" style={{ resize: 'vertical' }} placeholder="Overview of publication..."></textarea>
              </div>

              <button type="submit" className="btn btn-purple" style={{ width: '100%', marginTop: '0.5rem' }}>
                Save Publication to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
