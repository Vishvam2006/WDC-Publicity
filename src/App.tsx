import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckSquare, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

import Dashboard from './pages/Dashboard';
import MasterTimetable from './pages/MasterTimetable';
import Tracker from './pages/Tracker';
import Auth from './pages/Auth';

function App() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('pdpu_student_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const handleLogin = (p: any) => {
    localStorage.setItem('pdpu_student_profile', JSON.stringify(p));
    setProfile(p);
  };

  const handleLogout = () => {
    localStorage.removeItem('pdpu_student_profile');
    setProfile(null);
  };

  if (loading) return <div>Loading...</div>;

  if (!profile) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <h2 style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Timetable Tracker</h2>
          
          <div style={{ padding: '0 1rem', marginBottom: '2rem', fontSize: '0.85rem', color: '#666' }}>
            <div>{profile.year} - {profile.department} (Div {profile.division})</div>
          </div>

          <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          
          <NavLink to="/timetable" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Calendar size={20} /> My Timetable
          </NavLink>
          
          <NavLink to="/tracker" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} /> Activity Tracker
          </NavLink>

          {/* Hidden legacy pages
          <NavLink to="/public" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CalendarDays size={20} /> Public Timetables
          </NavLink>
          <NavLink to="/compare" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <GitCompare size={20} /> Compare
          </NavLink>
          <NavLink to="/groups" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Groups
          </NavLink>
          */}

          <button className="sidebar-link" onClick={handleLogout} style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', marginTop: 'auto', color: 'var(--danger)' }}>
            <LogOut size={20} /> Logout
          </button>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard profile={profile} />} />
            <Route path="/timetable" element={<MasterTimetable profile={profile} />} />
            <Route path="/tracker" element={<Tracker profile={profile} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
