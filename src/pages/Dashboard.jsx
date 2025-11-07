import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import MealForm from '../components/MealForm';
import MealList from '../components/MealList';

export default function Dashboard() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleMealAdded = () => {
    // Trigger refresh of meal list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">NutriSync</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meal Form - Left Column */}
          <div className="lg:col-span-1">
            <MealForm onMealAdded={handleMealAdded} />
          </div>

          {/* Meal List - Right Column */}
          <div className="lg:col-span-2">
            <MealList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}
