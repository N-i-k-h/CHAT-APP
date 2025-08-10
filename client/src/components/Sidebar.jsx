import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const { authUser, logout, onlineUsers } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const { data } = await axios.get('/api/messages/users');
        if (data.success) {
          setUsers(data.users);
          setUnseenMessages(data.unseenMessages || {});
        } else {
          toast.error(data.message || 'Failed to load users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users. Please try again.');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (authUser) {
      fetchUsers();
      const interval = setInterval(fetchUsers, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [authUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#1E1E2C] h-full p-4 rounded-l-xl overflow-y-auto text-white w-72">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 w-full">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 p-2 rounded-full">
              <img src={assets.chat_icon} alt="Logo" className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold">QuickChat</h2>
          </div>
          <div className="relative" ref={menuRef}>
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="w-5 h-5 cursor-pointer"
              onClick={() => setMenuOpen(prev => !prev)}
            />
            {menuOpen && (
              <div className="absolute right-0 mt-1 z-20 w-32 p-2 rounded-md bg-[#282142] border border-gray-600 text-gray-100">
                <p
                  onClick={() => {
                    navigate('/profile');
                    setMenuOpen(false);
                  }}
                  className="cursor-pointer text-sm p-2 hover:bg-gray-600"
                >
                  Edit profile
                </p>
                <hr className="my-1 border-t border-gray-500" />
                <p
                  className="cursor-pointer text-sm p-2 hover:bg-gray-600"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  Logout
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#282142] rounded-full flex items-center px-4 py-2 gap-2 mb-4">
          <img src={assets.search_icon} alt="Search" className="w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
            placeholder="Search user..."
          />
        </div>

        <div className="flex flex-col space-y-2">
          {loadingUsers ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              const isSelected = selectedUser?._id === user._id;
              const hasUnseenMessages = unseenMessages[user._id] > 0;

              return (
                <div
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    if (unseenMessages[user._id]) {
                      setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
                    }
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition hover:bg-[#282142] ${
                    isSelected ? 'bg-[#282142]' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={user.profilePic || assets.avatar_icon}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1E1E2C]"></span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <span className={`text-xs ${
                      isOnline ? 'text-green-400' : 'text-neutral-400'
                    }`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {hasUnseenMessages && (
                    <div className="text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 text-white">
                      {unseenMessages[user._id]}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400 py-4">
              {searchTerm ? 'No matching users found' : 'No users available'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;