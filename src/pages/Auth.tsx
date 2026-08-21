import { useState } from 'react';

export default function Auth({ onLogin }: { onLogin: (profile: any) => void }) {
  const [department, setDepartment] = useState('CE');
  const [year, setYear] = useState('3rd Year');
  const [division, setDivision] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ department, year, division });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>PDPU Timetable</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>Select your profile to view your timetable.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department</label>
            <select className="form-control" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="CE">Computer Engineering (CE)</option>
              {/* Add more options as needed */}
            </select>
          </div>
          
          <div className="form-group">
            <label>Year</label>
            <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Division</label>
            <select className="form-control" value={division} onChange={e => setDivision(e.target.value)}>
              <option value="1">Division 1</option>
              <option value="2">Division 2</option>
              <option value="3">Division 3</option>
              <option value="4">Division 4</option>
              <option value="5">Division 5</option>
              <option value="6">Division 6</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
