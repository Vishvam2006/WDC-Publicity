import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function GroupManagement() {
  const groups = useLiveQuery(async () => {
    const publicTimetables = await db.timetables.where('type').equals('public').toArray();
    
    // For MVP, just resolve the IDs manually
    const resolved = await Promise.all(publicTimetables.map(async (t) => {
      const dept = await db.departments.get(t.department_id!);
      const batch = await db.batches.get(t.batch_id!);
      const div = await db.divisions.get(t.division_id!);
      const entries = await db.timetable_entries.where('timetable_id').equals(t.id).count();
      
      return {
        id: t.id,
        name: t.name,
        department: dept?.name || 'Unknown',
        batch: batch?.name || 'Unknown',
        division: div?.name || 'Unknown',
        entriesCount: entries
      };
    }));
    return resolved;
  });

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Manage Groups</h1>
      <div className="card">
        {groups && groups.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Batch</th>
                <th>Division</th>
                <th>Timetable Name</th>
                <th>Classes</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id}>
                  <td>{g.department}</td>
                  <td>{g.batch}</td>
                  <td>{g.division}</td>
                  <td>{g.name}</td>
                  <td>{g.entriesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No public groups imported yet.</p>
        )}
      </div>
    </div>
  );
}
