import React, { useContext, useState } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null);
  const [previewImg, setPreviewImg] = useState(authUser?.profilePic || assets.avatar_icon);
  const [name, setName] = useState(authUser?.fullName || '');
  const [bio, setBio] = useState(authUser?.bio || '');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      let profilePic = authUser?.profilePic;
      
      if (selectedImg) {
        // Convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        profilePic = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
        });
      }

      const success = await updateProfile({
        fullName: name,
        bio,
        profilePic
      });

      if (success) {
        setMessage('✅ Profile updated successfully');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage('❌ Failed to update profile');
      }
    } catch (error) {
      setMessage('❌ Failed to update profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-lg text-gray-300 border border-gray-700 rounded-xl shadow-xl flex max-sm:flex-col-reverse'>
        {/* Form Section */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-6 flex-1'>
          <h3 className='text-xl font-semibold text-white'>Profile details</h3>
          
          {/* Profile Image Upload */}
          <label htmlFor="avatar" className='flex flex-col items-center gap-3 cursor-pointer'>
            <input
              onChange={(e) => {
                const file = e.target.files[0];
                setSelectedImg(file);
                if (file) {
                  setPreviewImg(URL.createObjectURL(file));
                }
              }}
              type="file"
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
            />
            <img
              src={previewImg}
              alt="Profile"
              className={`w-24 h-24 object-cover rounded-full ${(!selectedImg && !authUser?.profilePic) ? 'bg-gray-700' : ''}`}
            />
            <span className='text-violet-400 hover:text-violet-300'>Upload profile image</span>
          </label>

          {/* Name Input */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder='Your name'
            className='p-3 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-violet-500'
          />

          {/* Bio Input */}
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className='p-3 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-violet-500'
            rows={4}
          ></textarea>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-gradient-to-r from-purple-500 to-violet-600 text-white p-3 rounded-full text-lg font-medium cursor-pointer hover:from-purple-600 hover:to-violet-700 transition-all mt-4 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>

          {/* Success/Error Message */}
          {message && (
            <p className={`text-sm text-center mt-2 ${
              message.includes('✅') ? 'text-green-400' : 'text-red-400'
            }`}>
              {message}
            </p>
          )}
        </form>

        {/* Logo Section */}
        <div className='flex items-center justify-center p-4'>
          <img
            className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10`}
            src={assets.logo_icon}
            alt="Logo"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;