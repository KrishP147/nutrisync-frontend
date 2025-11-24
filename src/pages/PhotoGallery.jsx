import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { motion } from 'motion/react';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);

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

  const extractFilePathFromUrl = (url) => {
    // Extract the file path from the Supabase storage URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/meal-photos/[user_id]/[timestamp].jpg
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('meal-photos');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Get everything after 'meal-photos'
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      // Fallback: try to extract from the pathname directly
      const match = url.match(/meal-photos\/(.+)$/);
      return match ? match[1] : null;
    } catch (err) {
      console.error('Error extracting file path from URL:', err);
      return null;
    }
  };

  const handleDeletePhoto = async (meal) => {
    if (!window.confirm(`Are you sure you want to delete this photo? This will remove the photo from storage but keep the meal record.`)) {
      return;
    }

    setDeletingPhotoId(meal.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Extract file path from photo URL
      const filePath = extractFilePathFromUrl(meal.photo_url);
      
      if (filePath) {
        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('meal-photos')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting photo from storage:', storageError);
          // Continue to update meal record even if storage deletion fails
        }
      }

      // Update meal record to remove photo_url
      const { error: updateError } = await supabase
        .from('meals')
        .update({ photo_url: null })
        .eq('id', meal.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating meal record:', updateError);
        alert('Failed to delete photo: ' + updateError.message);
        setDeletingPhotoId(null);
        return;
      }

      // Refresh the photo gallery
      await fetchPhotos();
      setDeletingPhotoId(null);
      
      // Close viewing modal if the deleted photo was being viewed
      if (viewingPhoto && viewingPhoto.id === meal.id) {
        setViewingPhoto(null);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo: ' + err.message);
      setDeletingPhotoId(null);
    }
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
                >
                  <div 
                    className="aspect-square rounded-lg overflow-hidden border-2 border-purple-200 hover:border-purple-400 transition shadow-md hover:shadow-lg"
                    onClick={() => setViewingPhoto(meal)}
                  >
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(meal);
                    }}
                    disabled={deletingPhotoId === meal.id}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete photo"
                  >
                    {deletingPhotoId === meal.id ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
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
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{viewingPhoto.meal_name}</h3>
                    <p className="text-gray-600">{formatDate(viewingPhoto.consumed_at)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(viewingPhoto);
                    }}
                    disabled={deletingPhotoId === viewingPhoto.id}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deletingPhotoId === viewingPhoto.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Photo
                      </>
                    )}
                  </button>
                </div>
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
