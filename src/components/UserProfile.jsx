import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { calculateGoalsFromProfile, calculateBMI, getBMICategory } from '../utils/nutritionCalculator';
import { motion } from 'motion/react';

export default function UserProfile() {
  const { updateGoals } = useGoals();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  
  // Unit preferences
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  
  const [profile, setProfile] = useState({
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderately_active',
    goal_type: 'maintain',
    calorie_adjustment: 500
  });
  
  // Display values (in selected units)
  const [displayHeight, setDisplayHeight] = useState({ feet: '', inches: '', cm: '' });
  const [displayWeight, setDisplayWeight] = useState({ kg: '', lbs: '' });
  
  const [calculatedGoals, setCalculatedGoals] = useState(null);

  useEffect(() => {
    fetchProfile();
    // Initialize display values for new users
    if (!hasProfile) {
      setDisplayHeight({ feet: '', inches: '', cm: '' });
      setDisplayWeight({ kg: '', lbs: '' });
    }
  }, [hasProfile]);

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
          calorie_adjustment: data.calorie_adjustment || 500
        };
        setProfile(profileData);
        setHasProfile(true);
        
        // Set display values
        const cmToFeet = (cm) => {
          const totalInches = cm / 2.54;
          const feet = Math.floor(totalInches / 12);
          const inches = Math.round(totalInches % 12);
          return { feet: feet.toString(), inches: inches.toString() };
        };
        const kgToLbs = (kg) => Math.round(kg * 2.20462 * 10) / 10;
        
        setDisplayHeight({ 
          cm: data.height_cm.toString(),
          ...cmToFeet(data.height_cm)
        });
        setDisplayWeight({
          kg: data.weight_kg.toString(),
          lbs: kgToLbs(data.weight_kg).toString()
        });
        
        // Calculate goals when profile is loaded
        const goals = calculateGoalsFromProfile(profileData);
        
        // Include BMI in calculated goals if available
        if (data.bmi) {
          setCalculatedGoals({
            ...goals,
            bmi: data.bmi.toFixed(1),
            bmiCategory: {
              label: data.bmi_category,
              color: getBMICategory(data.bmi).color
            }
          });
        } else {
          // Calculate BMI if not in database yet
          const bmi = calculateBMI(data.weight_kg, data.height_cm);
          const bmiCategory = getBMICategory(bmi);
          setCalculatedGoals({
            ...goals,
            bmi: bmi.toFixed(1),
            bmiCategory
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
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

      // Calculate BMI
      const bmi = calculateBMI(parseFloat(profile.weight_kg), parseFloat(profile.height_cm));
      const bmiCategory = getBMICategory(bmi);

      // Save or update profile
      const profileData = {
        user_id: user.id,
        age: parseInt(profile.age),
        gender: profile.gender,
        height_cm: parseFloat(profile.height_cm),
        weight_kg: parseFloat(profile.weight_kg),
        activity_level: profile.activity_level,
        goal_type: profile.goal_type,
        bmi: parseFloat(bmi.toFixed(1)),
        bmi_category: bmiCategory.label
      };

      // Only add calorie_adjustment if it's not maintain goal
      if (profile.goal_type !== 'maintain' && profile.calorie_adjustment) {
        profileData.calorie_adjustment = parseInt(profile.calorie_adjustment);
      }

      let error;
      if (hasProfile) {
        // Update existing profile
        const result = await supabase
          .from('user_profile')
          .update(profileData)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new profile
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

      // Calculate and save goals
      const goals = calculateGoalsFromProfile(profile);
      
      // Include BMI in calculated goals for display
      setCalculatedGoals({
        ...goals,
        bmi: bmi.toFixed(1),
        bmiCategory: bmiCategory
      });
      
      // Update goals in context (saves to user_goals table)
      await updateGoals({
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
        fiber: goals.fiber || 30
      });

      setHasProfile(true);
      alert('Profile saved and goals updated!');
      
      // Refetch profile to ensure BMI is persisted
      await fetchProfile();
      setIsOpen(false);
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
      // Max height: 274cm (9 feet)
      const cm = Math.min(274, Math.max(1, parseFloat(value) || 1));
      setDisplayHeight({
        cm: value,
        ...cmToFeetInches(cm)
      });
      setProfile({ ...profile, height_cm: cm });
    } else if (unit === 'feet') {
      setDisplayHeight({ ...displayHeight, feet: value });
      const cm = Math.min(274, Math.max(1, feetInchesToCm(value, displayHeight.inches)));
      setProfile({ ...profile, height_cm: cm });
    } else if (unit === 'inches') {
      setDisplayHeight({ ...displayHeight, inches: value });
      const cm = Math.min(274, Math.max(1, feetInchesToCm(displayHeight.feet, value)));
      setProfile({ ...profile, height_cm: cm });
    }
  };

  // Handle weight input changes
  const handleWeightChange = (unit, value) => {
    if (unit === 'kg') {
      // Max weight: 159kg (350 lbs)
      const kg = Math.min(159, Math.max(1, parseFloat(value) || 1));
      setDisplayWeight({
        kg: value,
        lbs: kgToLbs(kg).toString()
      });
      setProfile({ ...profile, weight_kg: kg });
    } else if (unit === 'lbs') {
      // Max weight: 350 lbs
      const lbs = Math.min(350, Math.max(1, parseFloat(value) || 1));
      setDisplayWeight({
        lbs: value,
        kg: lbsToKg(lbs).toString()
      });
      setProfile({ ...profile, weight_kg: lbsToKg(lbs) });
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition font-medium shadow-lg hover:shadow-xl"
      >
        {hasProfile ? '📊 Update Profile & Calculate Goals' : '✨ Calculate Goals from Profile'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl border-2 border-teal-500 my-8 relative"
            >
            <h2 className="text-2xl font-bold text-black mb-4">Your Profile</h2>
            <p className="text-gray-600 mb-6">
              Enter your details to automatically calculate your daily nutrition goals
            </p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: Math.min(180, Math.max(1, parseInt(e.target.value) || 1)) })}
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
                      type="button"
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
                      type="button"
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
                    min="1"
                    max="274"
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
                        min="1"
                        max="9"
                        value={displayHeight.feet}
                        onChange={(e) => handleHeightChange('feet', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">feet (max 9)</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="11"
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
                      type="button"
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
                      type="button"
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
                  min="1"
                  max={weightUnit === 'kg' ? '159' : '350'}
                  value={weightUnit === 'kg' ? displayWeight.kg : displayWeight.lbs}
                  onChange={(e) => handleWeightChange(weightUnit, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
                  placeholder={weightUnit === 'kg' ? '70' : '154'}
                />
              </div>

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
                <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
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
                  <p className="text-xs text-gray-600 mt-1">
                    {profile.goal_type === 'lose' 
                      ? 'Recommended: 300-500 cal/day (~0.5-1 lb/week loss)'
                      : 'Recommended: 200-500 cal/day (lean gains)'}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Max: 1000 cal/day
                  </p>
                </div>
              )}

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                🧮 Calculate My Goals
              </button>

              {/* Calculated Results */}
              {calculatedGoals && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-500 rounded-lg p-6 space-y-3"
                >
                  <h3 className="text-lg font-bold text-black mb-3">📈 Your Calculated Goals</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-teal-300">
                      <p className="text-xs text-gray-600">BMI</p>
                      <p className="text-xl font-bold" style={{ color: calculatedGoals.bmiCategory?.color }}>
                        {calculatedGoals.bmi}
                      </p>
                      <p className="text-xs font-medium mt-1" style={{ color: calculatedGoals.bmiCategory?.color }}>
                        {calculatedGoals.bmiCategory?.label}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-teal-300">
                      <p className="text-xs text-gray-600">BMR</p>
                      <p className="text-xl font-bold text-teal-600">{calculatedGoals.bmr}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-teal-300">
                      <p className="text-xs text-gray-600">TDEE</p>
                      <p className="text-xl font-bold text-teal-600">{calculatedGoals.tdee}</p>
                    </div>
                  </div>

                  <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-500">
                    <h4 className="font-semibold text-purple-900 mb-2">Daily Targets:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-purple-700">Calories:</span>
                        <span className="font-bold text-purple-900 ml-2">{calculatedGoals.calories}</span>
                      </div>
                      <div>
                        <span className="text-purple-700">Protein:</span>
                        <span className="font-bold text-purple-900 ml-2">{calculatedGoals.protein}g</span>
                      </div>
                      <div>
                        <span className="text-purple-700">Carbs:</span>
                        <span className="font-bold text-purple-900 ml-2">{calculatedGoals.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-purple-700">Fat:</span>
                        <span className="font-bold text-purple-900 ml-2">{calculatedGoals.fat}g</span>
                      </div>
                      <div>
                        <span className="text-purple-700">Fiber:</span>
                        <span className="font-bold text-purple-900 ml-2">{calculatedGoals.fiber}g</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !calculatedGoals}
                className="flex-1 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : '💾 Save Profile & Apply Goals'}
              </button>
            </div>
          </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

