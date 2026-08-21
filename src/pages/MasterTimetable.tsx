import timetableData from '../data/timetable.json';

export default function MasterTimetable({ profile }: { profile: any }) {
  // Filter the pre-loaded JSON data based on user profile
  const myClasses = timetableData.filter((c: any) => {
    if (profile.department && c.department !== profile.department) return false;
    if (profile.year && c.year !== profile.year) return false;
    if (profile.division && c.division !== profile.division) return false;
    return true;
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>My Timetable</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Your full weekly schedule for {profile.year} {profile.department} Div {profile.division}
      </p>
      
      {days.map(day => {
        const dayClasses = myClasses.filter(c => c.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (dayClasses.length === 0) return null;

        return (
          <div key={day} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>{day}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {dayClasses.map((c: any, index) => (
                <div key={index} className="card" style={{ borderTop: '4px solid var(--secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{c.startTime} - {c.endTime}</span>
                    <span style={{ backgroundColor: '#eee', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {c.type}
                    </span>
                  </div>
                  <h4 style={{ marginBottom: '0.5rem' }}>{c.subject}</h4>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    <div>Faculty: {c.faculty}</div>
                    <div>Room: {c.room}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {myClasses.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No classes found for your profile. Please check your settings.
        </div>
      )}
    </div>
  );
}
