import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, Camera, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profile, setProfile] = useState({
    age: '', gender: 'male', height: '', weight: '',
    activity_level: 'moderate', goal_type: 'maintain'
  });
  const [passwords, setPasswords] = useState({
    current: '', new: '', confirm: ''
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data } = await supabase.from('user_profile').select('*').eq('user_id', user.id).single();
      if (data) {
        setProfile({
          age: data.age || '', gender: data.gender || 'male',
          height: data.height_cm || '', weight: data.weight_kg || '',
          activity_level: data.activity_level || 'moderate', goal_type: data.goal_type || 'maintain'
        });
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.from('user_profile').upsert({
        user_id: user.id,
        age: parseInt(profile.age) || null,
        gender: profile.gender,
        height_cm: parseFloat(profile.height) || null,
        weight_kg: parseFloat(profile.weight) || null,
        activity_level: profile.activity_level,
        goal_type: profile.goal_type
      }, { onConflict: 'user_id' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Loading profile...</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-heading font-bold text-white">
            Profile Settings
          </motion.h1>
          <p className="text-white/50 mt-1">Manage your account and preferences</p>
        </div>

        {/* Message */}
        {message.text && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-4 rounded-lg ${message.type === 'success' ? 'bg-primary-700/10 border border-primary-700/30 text-primary-500' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </motion.div>
        )}

        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
              <Mail size={20} className="text-secondary-400" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-white">Account</h2>
              <p className="text-white/50 text-sm">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
              <User size={20} className="text-primary-500" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-white">Personal Details</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Age</label>
                <input type="number" min="0" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">Gender</label>
                <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} className="input">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Height (cm)</label>
                <input type="number" min="0" value={profile.height} onChange={(e) => setProfile({ ...profile, height: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">Weight (kg)</label>
                <input type="number" min="0" value={profile.weight} onChange={(e) => setProfile({ ...profile, weight: e.target.value })} className="input" />
              </div>
            </div>

            <div>
              <label className="input-label">Activity Level</label>
              <select value={profile.activity_level} onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })} className="input">
                <option value="sedentary">Sedentary</option>
                <option value="light">Light Activity</option>
                <option value="moderate">Moderate Activity</option>
                <option value="active">Very Active</option>
                <option value="very_active">Athlete</option>
              </select>
            </div>

            <div>
              <label className="input-label">Goal</label>
              <select value={profile.goal_type} onChange={(e) => setProfile({ ...profile, goal_type: e.target.value })} className="input">
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Build Muscle</option>
              </select>
            </div>

            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full">
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Lock size={20} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-white">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="input-label">New Password</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="input" />
            </div>
            <button onClick={handleChangePassword} disabled={saving || !passwords.new} className="btn-outline w-full">
              Update Password
            </button>
          </div>
        </motion.div>
      </div>
    </Sidebar>
  );
}
