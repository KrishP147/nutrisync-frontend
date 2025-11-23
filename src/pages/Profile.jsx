import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { calculateGoalsFromProfile, calculateBMI, getBMICategory } from '../utils/nutritionCalculator';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from '../components/Navigation';

export default function Profile() {
  const { updateGoals } = useGoals();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  
  // Unit preferences
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft'
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'lbs'
  
  // Profile data (stored in metric)
  const [profile, setProfile] = useState({
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderately_active',
    goal_type: 'maintain',
    calorie_adjustment: 500 // Default deficit/surplus amount
  });

  // Display values (in selected units)
  const [displayHeight, setDisplayHeight] = useState({ feet: '', inches: '', cm: '' });
  const [displayWeight, setDisplayWeight] = useState({ kg: '', lbs: '' });
  
  const [calculatedGoals, setCalculatedGoals] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Initialize display values when profile changes
  useEffect(() => {
    if (!hasProfile && !loading) {
      setDisplayHeight({ feet: '', inches: '', cm: '' });
      setDisplayWeight({ kg: '', lbs: '' });
    }
  }, [hasProfile, loading]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        const profileData = {
          ...data,
          calorie_adjustment: data.calorie_adjustment || 500 // Default if not set
        };
        setProfile(profileData);
        setHasProfile(true);
        
        // Set display values
        setDisplayHeight({ 
          cm: data.height_cm.toString(),
          ...cmToFeetInches(data.height_cm)
        });
        setDisplayWeight({
          kg: data.weight_kg.toString(),
          lbs: kgToLbs(data.weight_kg).toString()
        });

        // Calculate goals
        const goals = calculateGoalsFromProfile(profileData);
        setCalculatedGoals(goals);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Unit conversion functions
  const cmToFeetInches = (cm) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet: feet.toString(), inches: inches.toString() };
  };

  const feetInchesToCm = (feet, inches) => {
    return ((parseInt(feet) || 0) * 12 + (parseInt(inches) || 0)) * 2.54;
  };

  const kgToLbs = (kg) => {
    return Math.round(kg * 2.20462 * 10) / 10;
  };

  const lbsToKg = (lbs) => {
    return Math.round(lbs / 2.20462 * 10) / 10;
  };

  // Handle height input changes
  const handleHeightChange = (unit, value) => {
    if (unit === 'cm') {
      const cm = parseFloat(value) || 0;
      setDisplayHeight({ 
        cm: value,
        ...cmToFeetInches(cm)
      });
      setProfile({ ...profile, height_cm: cm });
    } else if (unit === 'feet') {
      setDisplayHeight({ ...displayHeight, feet: value });
      const cm = feetInchesToCm(value, displayHeight.inches);
      setProfile({ ...profile, height_cm: cm });
    } else if (unit === 'inches') {
      setDisplayHeight({ ...displayHeight, inches: value });
      const cm = feetInchesToCm(displayHeight.feet, value);
      setProfile({ ...profile, height_cm: cm });
    }
  };

  // Handle weight input changes
  const handleWeightChange = (unit, value) => {
    if (unit === 'kg') {
      const kg = parseFloat(value) || 0;
      setDisplayWeight({
        kg: value,
        lbs: kgToLbs(kg).toString()
      });
      setProfile({ ...profile, weight_kg: kg });
    } else if (unit === 'lbs') {
      const lbs = parseFloat(value) || 0;
      setDisplayWeight({
        lbs: value,
        kg: lbsToKg(lbs).toString()
      });
      setProfile({ ...profile, weight_kg: lbsToKg(lbs) });
    }
  };

  const handleCalculate = () => {
    if (!profile.age || !profile.height_cm || !profile.weight_kg) {
      alert('Please fill in all required fields');
      return;
    }

    const goals = calculateGoalsFromProfile(profile);
    const bmi = calculateBMI(profile.weight_kg, profile.height_cm);
    const bmiCategory = getBMICategory(bmi);
    
    setCalculatedGoals({
      ...goals,
      bmi: bmi.toFixed(1),
      bmiCategory
    });
  };

  const handleSaveProfile = async () => {
    if (!profile.age || !profile.height_cm || !profile.weight_kg) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to save profile');
        setSaving(false);
        return;
      }

      const profileData = {
        user_id: user.id,
        age: parseInt(profile.age),
        gender: profile.gender,
        height_cm: parseFloat(profile.height_cm),
        weight_kg: parseFloat(profile.weight_kg),
        activity_level: profile.activity_level,
        goal_type: profile.goal_type
      };

      // Only add calorie_adjustment if it's not maintain goal
      if (profile.goal_type !== 'maintain' && profile.calorie_adjustment) {
        profileData.calorie_adjustment = parseInt(profile.calorie_adjustment);
      }

      let error;
      if (hasProfile) {
        const result = await supabase
          .from('user_profile')
          .update(profileData)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('user_profile')
          .insert(profileData);
        error = result.error;
      }

      if (error) {
        console.error('Error saving profile:', error);
        console.error('Profile data attempted:', profileData);
        alert(`Failed to save profile: ${error.message || 'Please try again.'}`);
        setSaving(false);
        return;
      }

      const goals = calculateGoalsFromProfile(profile);
      const bmi = calculateBMI(profile.weight_kg, profile.height_cm);
      const bmiCategory = getBMICategory(bmi);

      setCalculatedGoals({
        ...goals,
        bmi: bmi.toFixed(1),
        bmiCategory
      });

      await updateGoals({
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat
      });

      setHasProfile(true);
      alert('Profile saved and goals updated!');
    } catch (error) {
      console.error('Error in handleSaveProfile:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (6-7 days/week)' },
    { value: 'extra_active', label: 'Extra Active (physical job + exercise)' }
  ];

  const goalTypes = [
    { value: 'lose', label: 'Lose Weight' },
    { value: 'maintain', label: 'Maintain Weight' },
    { value: 'gain', label: 'Gain Weight' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-2xl border-2 border-teal-500"
        >
          <h1 className="text-3xl font-bold text-black mb-2">Your Profile</h1>
          <p className="text-gray-600 mb-8">
            Enter your details to automatically calculate your daily nutrition goals
          </p>

          <div className="space-y-6 mb-8">
            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                  placeholder="25"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Height with unit toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Height *
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHeightUnit('cm')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      heightUnit === 'cm' 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    onClick={() => setHeightUnit('ft')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      heightUnit === 'ft' 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ft/in
                  </button>
                </div>
              </div>

              {heightUnit === 'cm' ? (
                <input
                  type="number"
                  step="0.1"
                  value={displayHeight.cm}
                  onChange={(e) => handleHeightChange('cm', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                  placeholder="175"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      value={displayHeight.feet}
                      onChange={(e) => handleHeightChange('feet', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                      placeholder="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">feet</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={displayHeight.inches}
                      onChange={(e) => handleHeightChange('inches', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                      placeholder="9"
                    />
                    <p className="text-xs text-gray-500 mt-1">inches</p>
                  </div>
                </div>
              )}
            </div>

            {/* Weight with unit toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Weight *
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWeightUnit('kg')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      weightUnit === 'kg' 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    onClick={() => setWeightUnit('lbs')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      weightUnit === 'lbs' 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>

              <input
                type="number"
                step="0.1"
                value={weightUnit === 'kg' ? displayWeight.kg : displayWeight.lbs}
                onChange={(e) => handleWeightChange(weightUnit, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                placeholder={weightUnit === 'kg' ? '70' : '154'}
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Level *
              </label>
              <select
                value={profile.activity_level}
                onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              >
                {activityLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal *
              </label>
              <select
                value={profile.goal_type}
                onChange={(e) => setProfile({ ...profile, goal_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              >
                {goalTypes.map(goal => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Calorie Adjustment (only for lose/gain) */}
            {profile.goal_type !== 'maintain' && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {profile.goal_type === 'lose' ? 'Daily Calorie Deficit *' : 'Daily Calorie Surplus *'}
                </label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={profile.calorie_adjustment}
                  onChange={(e) => setProfile({ ...profile, calorie_adjustment: parseInt(e.target.value) || 500 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                  placeholder="500"
                />
                <p className="text-xs text-gray-600 mt-2">
                  {profile.goal_type === 'lose' 
                    ? 'Recommended: 300-500 cal/day for gradual weight loss (~0.5-1 lb/week)'
                    : 'Recommended: 200-500 cal/day for lean muscle gain'}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Max: 1000 cal/day - Higher values may be unhealthy
                </p>
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium text-lg"
            >
              🧮 Calculate My Goals
            </button>

            {/* Calculated Results */}
            <AnimatePresence>
              {calculatedGoals && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-500 rounded-lg p-6 space-y-4"
                >
                  <h3 className="text-xl font-bold text-black mb-3">📈 Your Calculated Goals</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-teal-300">
                      <p className="text-sm text-gray-600">BMI</p>
                      <p className="text-2xl font-bold" style={{ color: calculatedGoals.bmiCategory?.color }}>
                        {calculatedGoals.bmi}
                      </p>
                      <p className="text-xs font-medium mt-1" style={{ color: calculatedGoals.bmiCategory?.color }}>
                        {calculatedGoals.bmiCategory?.label}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-teal-300">
                      <p className="text-sm text-gray-600">BMR (Basal Rate)</p>
                      <p className="text-2xl font-bold text-teal-600">{calculatedGoals.bmr} cal</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-teal-300">
                      <p className="text-sm text-gray-600">TDEE (Maintenance)</p>
                      <p className="text-2xl font-bold text-teal-600">{calculatedGoals.tdee} cal</p>
                    </div>
                  </div>

                  <div className="bg-purple-100 p-6 rounded-lg border-2 border-purple-500">
                    <h4 className="font-bold text-purple-900 mb-4 text-lg">Daily Targets:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-sm text-purple-700">Calories</span>
                        <p className="text-2xl font-bold text-purple-900">{calculatedGoals.calories}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-sm text-purple-700">Protein</span>
                        <p className="text-2xl font-bold text-purple-900">{calculatedGoals.protein}g</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-sm text-purple-700">Carbs</span>
                        <p className="text-2xl font-bold text-purple-900">{calculatedGoals.carbs}g</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-sm text-purple-700">Fat</span>
                        <p className="text-2xl font-bold text-purple-900">{calculatedGoals.fat}g</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving || !calculatedGoals}
            className="w-full bg-teal-600 text-white py-4 rounded-lg hover:bg-teal-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {saving ? 'Saving...' : '💾 Save Profile & Apply Goals'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

