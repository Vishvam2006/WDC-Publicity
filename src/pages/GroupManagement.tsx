import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function GroupManagement() {
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const publicTimetables = await api.getTimetables('public');
        
        const resolved = await Promise.all(publicTimetables.map(async (t: any) => {
          const dept = t.department_id ? await api.getDepartment(t.department_id) : null;
          const batch = t.batch_id ? await api.getBatch(t.batch_id) : null;
          const div = t.division_id ? await api.getDivision(t.division_id) : null;
          const entries = await api.getTimetableEntries(t.id);
          
          return {
            id: t.id,
            name: t.name,
            department: dept?.name || 'Unknown',
            batch: batch?.name || 'Unknown',
            division: div?.name || 'Unknown',
            entriesCount: entries.length
          };
        }));
        setGroups(resolved);
      } catch (e) {
        console.error(e);
      }
    };
    loadGroups();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Manage Groups</h1>
      <div className="card">
        {groups && groups.length > 0 ? (
          <div className="table-responsive">
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
          </div>
        ) : (
          <p>No public groups imported yet.</p>
        )}
      </div>
    </div>
  );
}
