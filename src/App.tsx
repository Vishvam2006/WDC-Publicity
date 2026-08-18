import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarDays, GitCompare, CheckSquare, Users } from 'lucide-react';

// Placeholders for pages
import Dashboard from './pages/Dashboard';
import MasterTimetable from './pages/MasterTimetable';
import PublicTimetables from './pages/PublicTimetables';
import Compare from './pages/Compare';
import Tracker from './pages/Tracker';
import GroupManagement from './pages/GroupManagement';

function App() {

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <h2 style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Timetable Tracker</h2>
          
          <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          
          <NavLink to="/master" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Calendar size={20} /> My Timetable
          </NavLink>
          
          <NavLink to="/public" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CalendarDays size={20} /> Public Timetables
          </NavLink>
          
          <NavLink to="/compare" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <GitCompare size={20} /> Compare
          </NavLink>

          <NavLink to="/tracker" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} /> Activity Tracker
          </NavLink>

          <NavLink to="/groups" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Groups
          </NavLink>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/master" element={<MasterTimetable />} />
            <Route path="/public" element={<PublicTimetables />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/groups" element={<GroupManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
