import React, { useContext } from 'react';
import assets from '../assets/assets';
import { AuthContext } from '../context/AuthContext';

const RightSidebar = ({ selectedUser }) => {
  const { logout, onlineUsers } = useContext(AuthContext);

  if (!selectedUser || typeof selectedUser !== 'object') {
    return null;
  }

  // Filter messages with images
  const sharedMedia = selectedUser.sharedMedia || [];

  return (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-auto ${selectedUser ? "max-md:hidden" : ''}`}>
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt="Profile"
          className='w-20 aspect-square rounded-full object-cover'
        />
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          <span className={`w-2 h-2 rounded-full ${
            onlineUsers.includes(selectedUser._id) ? 'bg-green-500' : 'bg-gray-500'
          }`}></span>
          {selectedUser.fullName}
        </h1>
        <p className='px-10 mx-auto'>{selectedUser.bio}</p>
      </div>
      <hr className="border-[#ffffff50] my-4" />

      <div className='px-5 text-xs'>
        <p className='text-sm font-semibold mb-2'>Shared Media</p>
        <div className='grid grid-cols-2 gap-4 max-h-[200px] overflow-y-auto'>
          {sharedMedia.length > 0 ? (
            sharedMedia.map((url, index) => (
              <div
                key={index}
                onClick={() => window.open(url, '_blank')}
                className='cursor-pointer rounded overflow-hidden'
              >
                <img
                  src={url}
                  alt={`Media ${index + 1}`}
                  className='w-full h-24 object-cover rounded-md'
                />
              </div>
            ))
          ) : (
            <p className="col-span-2 text-center text-gray-400 py-4">No media shared yet</p>
          )}
        </div>
      </div>

      <button 
        onClick={logout}
        className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-violet-500 text-white px-4 py-2 rounded-full hover:bg-violet-600 transition-colors duration-200'
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;