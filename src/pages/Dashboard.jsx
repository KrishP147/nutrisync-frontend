import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import MealForm from '../components/MealForm';
import MealList from '../components/MealList';
import DailySummary from '../components/DailySummary';
import WeeklyTrends from '../components/WeeklyTrends';
import Recommendations from '../components/Recommendations';
import PhotoMealUpload from '../components/PhotoMealUpload';
import Sidebar from '../components/layout/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content - with left margin for sidebar */}
      <div className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Daily Summary */}
          <DailySummary key={refreshTrigger} />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Meal Form */}
            <div className="lg:col-span-1 space-y-8">
              <PhotoMealUpload onMealAdded={handleMealAdded} />
              <MealForm onMealAdded={handleMealAdded} />
              <Recommendations key={refreshTrigger} />
            </div>

            {/* Right Column - Analytics */}
            <div className="lg:col-span-2 space-y-8">
              <WeeklyTrends key={refreshTrigger} />
              <MealList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
