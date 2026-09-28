import { useEffect, useState } from 'react';
import { apiClient } from './api/client';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient('/api/v1/health')
      .then(data => setHealth(data))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="App" style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>ResourceHub</h1>
      <h2>Backend Health Check</h2>
      
      <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        {error ? (
          <p style={{ color: 'red', fontWeight: 'bold' }}>Error connecting to backend: {error}</p>
        ) : health ? (
          <div>
            <p style={{ color: 'green', fontWeight: 'bold' }}>Connected successfully!</p>
            <pre style={{ textAlign: 'left', background: '#e0e0e0', padding: '1rem' }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default App;
