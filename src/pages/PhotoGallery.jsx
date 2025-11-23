import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { motion } from 'motion/react';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all meals with photos
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .not('photo_url', 'is', null)
      .order('consumed_at', { ascending: false });

    if (!error && data) {
      setPhotos(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600 py-12">Loading photo gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📸 Photo Gallery</h1>
          <p className="text-gray-600">Browse all your meal photos</p>
        </motion.div>

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Photos Yet</h2>
            <p className="text-gray-600">Start logging meals with photos to see them here!</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">{photos.length} photos</p>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group cursor-pointer"
                  onClick={() => setViewingPhoto(meal)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-purple-200 hover:border-purple-400 transition shadow-md hover:shadow-lg">
                    <img
                      src={meal.photo_url}
                      alt={meal.meal_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition">
                    <p className="text-white text-xs font-semibold truncate">{meal.meal_name}</p>
                    <p className="text-white/80 text-xs">{formatDate(meal.consumed_at)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Photo Viewing Modal */}
        {viewingPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingPhoto(null)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setViewingPhoto(null)}
                className="absolute -top-12 right-0 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition text-2xl font-bold"
              >
                ✕
              </button>
              <img
                src={viewingPhoto.photo_url}
                alt={viewingPhoto.meal_name}
                className="w-full h-auto rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="bg-white rounded-lg p-4 mt-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{viewingPhoto.meal_name}</h3>
                <p className="text-gray-600 mb-2">{formatDate(viewingPhoto.consumed_at)}</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Calories</p>
                    <p className="text-lg font-bold text-blue-600">{viewingPhoto.total_calories}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Protein</p>
                    <p className="text-lg font-bold text-green-600">{viewingPhoto.total_protein_g}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Carbs</p>
                    <p className="text-lg font-bold text-orange-600">{viewingPhoto.total_carbs_g}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Fat</p>
                    <p className="text-lg font-bold text-purple-600">{viewingPhoto.total_fat_g}g</p>
                  </div>
                </div>
                {viewingPhoto.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600 font-semibold">Notes:</p>
                    <p className="text-gray-800">{viewingPhoto.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
