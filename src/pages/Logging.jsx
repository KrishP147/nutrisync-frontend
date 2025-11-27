import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, PenLine, Image, ChevronLeft, ChevronRight, X, Star, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/layout/Sidebar';
import MealForm from '../components/MealForm';
import PhotoMealUpload from '../components/PhotoMealUpload';
import MealList from '../components/MealList';

export default function Logging() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('photo');
  const [allPhotos, setAllPhotos] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // My Foods state
  const [customFoods, setCustomFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [creatingFood, setCreatingFood] = useState(false);
  const [newFoodValues, setNewFoodValues] = useState({
    name: '', base_calories: 0, base_protein_g: 0, base_carbs_g: 0, base_fat_g: 0, base_fiber_g: 0
  });

  useEffect(() => {
    fetchAllPhotos();
    fetchCustomFoods();
  }, [refreshTrigger]);

  const fetchAllPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('meals')
      .select('id, photo_url, meal_name, consumed_at, total_calories')
      .eq('user_id', user.id)
      .not('photo_url', 'is', null)
      .order('consumed_at', { ascending: false })
      .limit(50);

    if (data) {
      setAllPhotos(data);
    }
  };

  const fetchCustomFoods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('user_foods').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setCustomFoods(data);
  };

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const openGallery = (index) => {
    setCurrentPhotoIndex(index);
    setGalleryOpen(true);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  // My Foods handlers
  const handleEditFood = (food) => {
    setEditingFood(food.id);
    setEditValues({ 
      name: food.name, 
      base_calories: food.base_calories, 
      base_protein_g: food.base_protein_g, 
      base_carbs_g: food.base_carbs_g, 
      base_fat_g: food.base_fat_g, 
      base_fiber_g: food.base_fiber_g 
    });
  };

  const handleSaveFood = async (foodId) => {
    const { error } = await supabase.from('user_foods').update(editValues).eq('id', foodId);
    if (!error) { 
      await fetchCustomFoods(); 
      setEditingFood(null); 
      setEditValues({}); 
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!confirm('Delete this custom food?')) return;
    const { error } = await supabase.from('user_foods').delete().eq('id', foodId);
    if (!error) await fetchCustomFoods();
  };

  const handleCreateFood = async () => {
    if (!newFoodValues.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('user_foods').insert([{ 
      user_id: user.id, 
      ...newFoodValues, 
      source: 'manual_creation' 
    }]);
    if (!error) {
      await fetchCustomFoods();
      setCreatingFood(false);
      setNewFoodValues({ name: '', base_calories: 0, base_protein_g: 0, base_carbs_g: 0, base_fat_g: 0, base_fiber_g: 0 });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!galleryOpen) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') setGalleryOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, allPhotos.length]);

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-heading font-bold text-white"
          >
            Log Meals
          </motion.h1>
          <p className="text-white/50 mt-1">Track your nutrition throughout the day</p>
        </div>

        {/* Logging Method Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'photo' 
                ? 'bg-primary-700 text-white' 
                : 'bg-[#0a0a0a] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            <Camera size={20} strokeWidth={2} />
            Photo Analysis
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'manual' 
                ? 'bg-primary-700 text-white' 
                : 'bg-[#0a0a0a] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            <PenLine size={20} strokeWidth={2} />
            Manual Entry
          </button>
        </div>

        {/* Logging Form */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'photo' ? (
            <PhotoMealUpload onMealAdded={handleMealAdded} />
          ) : (
            <MealForm onMealAdded={handleMealAdded} />
          )}
        </motion.div>

        {/* Logged Today Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-heading font-semibold text-white mb-4">Logged Today</h2>
          <div className="card p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
            <MealList 
              refreshTrigger={refreshTrigger}
              onMealDeleted={handleMealAdded}
              onMealUpdated={handleMealAdded}
              limit={20}
            />
          </div>
        </motion.div>

        {/* My Foods Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star size={20} className="text-amber-400" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-white">My Foods</h2>
                <p className="text-white/50 text-sm">{customFoods.length} custom foods saved</p>
              </div>
            </div>
            <button onClick={() => setCreatingFood(true)} className="btn-primary">
              <Plus size={18} /> Add Food
            </button>
          </div>

          {/* Create New Food Form */}
          {creatingFood && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-white mb-4">Create New Food</h3>
              <div className="space-y-3 mb-4">
                <input type="text" placeholder="Food name" value={newFoodValues.name} onChange={(e) => setNewFoodValues({ ...newFoodValues, name: e.target.value })}
                  className="input w-full" />
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="grid grid-cols-5 gap-2 min-w-[500px] sm:min-w-0">
                    <input type="number" placeholder="Calories" min="0" value={newFoodValues.base_calories} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_calories: e.target.value })}
                      className="input text-center text-xs sm:text-sm" />
                    <input type="number" placeholder="Protein" min="0" step="0.1" value={newFoodValues.base_protein_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_protein_g: e.target.value })}
                      className="input text-center text-xs sm:text-sm" />
                    <input type="number" placeholder="Carbs" min="0" step="0.1" value={newFoodValues.base_carbs_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_carbs_g: e.target.value })}
                      className="input text-center text-xs sm:text-sm" />
                    <input type="number" placeholder="Fat" min="0" step="0.1" value={newFoodValues.base_fat_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_fat_g: e.target.value })}
                      className="input text-center text-xs sm:text-sm" />
                    <input type="number" placeholder="Fiber" min="0" step="0.1" value={newFoodValues.base_fiber_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_fiber_g: e.target.value })}
                      className="input text-center text-xs sm:text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateFood} className="btn-primary"><Save size={16} /> Save</button>
                <button onClick={() => setCreatingFood(false)} className="btn-secondary"><X size={16} /> Cancel</button>
              </div>
            </div>
          )}

          {/* Custom Foods List */}
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {customFoods.length === 0 ? (
              <p className="text-white/40 text-center py-8">No custom foods yet. Add your favorite foods for quick logging!</p>
            ) : (
              customFoods.map((food) => (
                <div key={food.id} className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
                  {editingFood === food.id ? (
                    <div className="space-y-3">
                      <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="input w-full" />
                      <div className="overflow-x-auto -mx-4 px-4">
                        <div className="grid grid-cols-5 gap-2 min-w-[500px] sm:min-w-0">
                          <input type="number" min="0" value={editValues.base_calories} onChange={(e) => setEditValues({ ...editValues, base_calories: e.target.value })} className="input text-center text-xs sm:text-sm" placeholder="Cal" />
                          <input type="number" min="0" step="0.1" value={editValues.base_protein_g} onChange={(e) => setEditValues({ ...editValues, base_protein_g: e.target.value })} className="input text-center text-xs sm:text-sm" placeholder="P" />
                          <input type="number" min="0" step="0.1" value={editValues.base_carbs_g} onChange={(e) => setEditValues({ ...editValues, base_carbs_g: e.target.value })} className="input text-center text-xs sm:text-sm" placeholder="C" />
                          <input type="number" min="0" step="0.1" value={editValues.base_fat_g} onChange={(e) => setEditValues({ ...editValues, base_fat_g: e.target.value })} className="input text-center text-xs sm:text-sm" placeholder="F" />
                          <input type="number" min="0" step="0.1" value={editValues.base_fiber_g} onChange={(e) => setEditValues({ ...editValues, base_fiber_g: e.target.value })} className="input text-center text-xs sm:text-sm" placeholder="Fiber" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveFood(food.id)} className="btn-primary text-sm"><Save size={14} /> Save</button>
                        <button onClick={() => setEditingFood(null)} className="btn-secondary text-sm"><X size={14} /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{food.name}</p>
                        <p className="text-white/50 text-sm">
                          {food.base_calories} cal | {food.base_protein_g}g P | {food.base_carbs_g}g C | {food.base_fat_g}g F | {food.base_fiber_g}g Fiber
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditFood(food)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteFood(food.id)} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/10">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Photo Gallery */}
        {allPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                  <Image size={20} className="text-secondary-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Gallery</h2>
                  <p className="text-white/50 text-sm">{allPhotos.length} meal photos</p>
                </div>
              </div>
            </div>
            
            {/* Photo Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {allPhotos.slice(0, 16).map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => openGallery(index)}
                  className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-primary-700 transition group relative"
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.meal_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {index === 15 && allPhotos.length > 16 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-mono font-bold">+{allPhotos.length - 16}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox Gallery */}
      <AnimatePresence>
        {galleryOpen && allPhotos[currentPhotoIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setGalleryOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X size={24} />
            </button>

            {/* Previous button */}
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ChevronLeft size={32} />
            </button>

            {/* Image */}
            <motion.div
              key={currentPhotoIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl max-h-[80vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={allPhotos[currentPhotoIndex].photo_url}
                alt={allPhotos[currentPhotoIndex].meal_name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                <p className="text-white font-medium">{allPhotos[currentPhotoIndex].meal_name}</p>
                <p className="text-white/60 text-sm">
                  {allPhotos[currentPhotoIndex].total_calories} cal • 
                  {new Date(allPhotos[currentPhotoIndex].consumed_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>

            {/* Next button */}
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ChevronRight size={32} />
            </button>

            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full text-white text-sm font-mono">
              {currentPhotoIndex + 1} / {allPhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sidebar>
  );
}
