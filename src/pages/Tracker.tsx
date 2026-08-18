import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Tracker() {
  const data = useLiveQuery(async () => {
    const activities = await db.tracked_activities.toArray();
    
    // Resolve entry details
    const resolved = await Promise.all(activities.map(async (act) => {
      const entry = await db.timetable_entries.get(act.source_entry_id);
      const timetable = entry ? await db.timetables.get(entry.timetable_id) : null;
      
      return {
        ...act,
        subject: entry?.subject || 'Unknown',
        time: `${entry?.start_time} - ${entry?.end_time}`,
        group: timetable?.name || 'Unknown'
      };
    }));

    return resolved;
  });

  const handleStatusChange = async (id: number, newStatus: string) => {
    await db.tracked_activities.update(id, { 
      status: newStatus as any,
      completed_at: newStatus === 'Completed' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    });
  };

  const handleDelete = async (id: number) => {
    await db.tracked_activities.delete(id);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Activity Tracker</h1>
      
      <div className="card">
        {data && data.length > 0 ? (
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
        ) : (
          <p>No activities tracked yet. Go to Compare to track some!</p>
        )}
      </div>
    </div>
  );
}
