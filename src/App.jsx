import { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    api.get('/health')
      .then(response => setStatus(response.data.status))
      .catch(error => setStatus('Error: ' + error.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          NutriSync
        </h1>
        <p className="text-gray-600">
          Backend Status: <span className="font-semibold">{status}</span>
        </p>
      </div>
    </div>
  );
}

export default App;