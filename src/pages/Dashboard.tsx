import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
      
      <div className="grid-dashboard">
        <div className="card stat-card">
          <h3>Public Groups</h3>
          <div className="stat-value">{stats?.publicGroups || 0}</div>
        </div>
        <div className="card stat-card">
          <h3>Pending Activities</h3>
          <div className="stat-value">{stats?.trackedPending || 0}</div>
        </div>
        <div className="card stat-card">
          <h3>Completed Activities</h3>
          <div className="stat-value">{stats?.trackedCompleted || 0}</div>
        </div>
        <div className="card stat-card">
          <h3>Completion %</h3>
          <div className="stat-value">
            {stats && (stats.trackedCompleted + stats.trackedPending > 0) 
              ? Math.round((stats.trackedCompleted / (stats.trackedCompleted + stats.trackedPending)) * 100)
              : 0}%
          </div>
        </div>
      </div>
    </div>
  );
}
