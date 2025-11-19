import { useState } from 'react';
import { supabase } from '../supabaseClient';
import api from '../services/api';

export default function PhotoMealUpload({ onMealAdded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/api/analyze-meal-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('meals')
        .insert([
          {
            user_id: user.id,
            meal_name: result.foods.map(f => f.name).join(', '),
            meal_type: result.meal_type,
            total_calories: result.total_nutrition.calories,
            total_protein_g: result.total_nutrition.protein_g,
            total_carbs_g: result.total_nutrition.carbs_g,
            total_fat_g: result.total_nutrition.fat_g,
            total_fiber_g: result.total_nutrition.fiber_g,
            is_ai_analyzed: true,
            notes: result.recommendations,
          },
        ])
        .select();

      if (!error) {
        // Reset form
        setSelectedFile(null);
        setPreview(null);
        setResult(null);
        
        if (onMealAdded) onMealAdded(data[0]);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to save meal');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📸 Photo Analysis</h2>

      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-600 mb-2">Drop an image here or click to upload</p>
            <p className="text-sm text-gray-500">Supported: JPG, PNG, HEIC</p>
          </label>
        </div>
      )}

      {preview && !result && (
        <div>
          <img src={preview} alt="Preview" className="w-full rounded-lg mb-4 max-h-64 object-cover" />
          
          <div className="flex gap-2">
            <button
              onClick={analyzeImage}
              disabled={analyzing}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {analyzing ? '🔍 Analyzing...' : '🤖 Analyze with AI'}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <img src={preview} alt="Analyzed" className="w-full rounded-lg max-h-48 object-cover" />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Detected Foods:</h3>
            <ul className="space-y-1">
              {result.foods.map((food, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  • {food.name} ({food.portion}) - {food.calories} cal
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-xl font-bold text-blue-600">{result.total_nutrition.calories}</p>
              <p className="text-xs text-gray-600">Calories</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-xl font-bold text-green-600">{result.total_nutrition.protein_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Protein</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <p className="text-xl font-bold text-yellow-600">{result.total_nutrition.carbs_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Carbs</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <p className="text-xl font-bold text-orange-600">{result.total_nutrition.fat_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Fat</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <p className="text-xl font-bold text-purple-600">{result.total_nutrition.fiber_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Fiber</p>
            </div>
          </div>

          {result.recommendations && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">💡 {result.recommendations}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={saveMeal}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              ✅ Save Meal
            </button>
            <button
              onClick={() => {
                setResult(null);
                setSelectedFile(null);
                setPreview(null);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Try Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}