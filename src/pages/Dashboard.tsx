import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Dashboard() {
  const stats = useLiveQuery(async () => {
    return {
      masterClasses: await db.timetable_entries.where('timetable_id').equals(1).count(),
      publicGroups: await db.timetables.where('type').equals('public').count(),
      trackedPending: await db.tracked_activities.where('status').equals('Planned').count(),
      trackedCompleted: await db.tracked_activities.where('status').equals('Completed').count(),
    };
  });

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
