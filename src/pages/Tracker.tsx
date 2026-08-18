import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Tracker() {
  const [data, setData] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const activities = await api.getTrackedActivities();
      
      const resolved = await Promise.all(activities.map(async (act: any) => {
        const entry = await api.getTimetableEntry(act.source_entry_id);
        let timetable = null;
        if (entry && entry.timetable_id) {
          timetable = await api.getTimetable(entry.timetable_id);
        }
        
        return {
          ...act,
          subject: entry?.subject || 'Unknown',
          time: `${entry?.start_time || ''} - ${entry?.end_time || ''}`,
          group: timetable?.name || 'Unknown'
        };
      }));
      setData(resolved);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await api.updateTrackedActivity(id, { 
      status: newStatus as any,
      completed_at: newStatus === 'Completed' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    await api.deleteTrackedActivity(id);
    loadData();
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Activity Tracker</h1>
      
      <div className="card">
        {data && data.length > 0 ? (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Group</th>
                  <th>Subject</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(act => (
                  <tr key={act.id}>
                    <td>{act.activity_date}</td>
                    <td>{act.group}</td>
                    <td>{act.subject}</td>
                    <td>{act.time}</td>
                    <td>
                      <span className={`badge ${act.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {act.status}
                      </span>
                    </td>
                    <td>
                      {act.status !== 'Completed' && (
                        <button className="btn btn-primary" style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }} onClick={() => handleStatusChange(act.id, 'Completed')}>
                          Complete
                        </button>
                      )}
                      {act.status === 'Completed' && (
                        <button className="btn" style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }} onClick={() => handleStatusChange(act.id, 'Planned')}>
                          Undo
                        </button>
                      )}
                      <button className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(act.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No activities tracked yet. Go to Compare to track some!</p>
        )}
      </div>
    </div>
  );
}
