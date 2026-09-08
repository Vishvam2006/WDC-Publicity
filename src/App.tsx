import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckSquare } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MasterTimetable from './pages/MasterTimetable';
import Tracker from './pages/Tracker';

function App() {
  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <h2 style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Timetable Tracker</h2>

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

          {/* Removed Logout since Auth is not required */}
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timetable" element={<MasterTimetable />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
