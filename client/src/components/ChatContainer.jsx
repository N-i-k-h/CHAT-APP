import React, { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const { authUser, socket } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollEndRef = useRef();

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
        
        if (data.success) {
          setMessages(data.messages);
        } else {
          toast.error(data.message || 'Failed to load messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages. Please try again.');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // Handle incoming real-time messages
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleNewMessage = (message) => {
      if (
        (message.senderId === selectedUser._id && message.receiverId === authUser._id) ||
        (message.receiverId === selectedUser._id && message.senderId === authUser._id)
      ) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedUser, authUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.match('image.*')) {
      toast.error('Only image files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !image) || isSending) return;

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('senderId', authUser._id);
      formData.append('receiverId', selectedUser._id);
      if (newMessage.trim()) formData.append('text', newMessage);
      if (image) formData.append('image', image);

      const { data } = await axios.post(
        `/api/messages/${selectedUser._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setImage(null);
        setImagePreview(null);
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.response) {
        if (error.response.status === 413) {
          toast.error('Image size too large (max 5MB)');
        } else {
          toast.error(error.response.data?.message || 'Failed to send message');
        }
      } else {
        toast.error('Network error - please check your connection');
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-2 text-gray-500 bg-white/10'>
        <img src={assets.logo_icon} alt="Logo" className='max-w-16' />
        <p className='text-lg font-medium text-white'>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className='flex items-center gap-3 py-3 border-b border-stone-500 px-2 md:px-4'>
        <img 
          src={selectedUser.profilePic || assets.avatar_icon} 
          alt="Profile" 
          className='w-8 h-8 rounded-full object-cover'
        />
        <div className='flex-1'>
          <p className='text-lg text-white'>{selectedUser.fullName}</p>
          <p className='text-xs text-gray-400'>
            {selectedUser.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <button 
          onClick={() => setSelectedUser(null)}
          className='md:hidden p-1 rounded-full hover:bg-gray-700'
        >
          <img src={assets.arrow_icon} alt="Back" className='w-5' />
        </button>
      </div>

      {/* Messages container */}
      <div className='flex-1 overflow-y-auto py-3 px-2 md:px-4'>
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex mb-4 ${message.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] gap-2 ${message.senderId === authUser._id ? 'flex-row-reverse' : ''}`}>
                <img
                  src={message.senderId === authUser._id 
                    ? (authUser.profilePic || assets.avatar_icon)
                    : (selectedUser.profilePic || assets.avatar_icon)}
                  alt="Avatar"
                  className='w-8 h-8 rounded-full object-cover'
                />
                <div>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Message content"
                      className='max-w-full max-h-64 rounded-lg mb-1 cursor-pointer'
                      onClick={() => window.open(message.image, '_blank')}
                    />
                  )}
                  {message.text && (
                    <div className={`p-3 rounded-lg ${message.senderId === authUser._id 
                      ? 'bg-violet-600 rounded-br-none' 
                      : 'bg-gray-700 rounded-bl-none'}`}
                    >
                      <p className='text-white'>{message.text}</p>
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${message.senderId === authUser._id ? 'text-right' : 'text-left'} text-gray-400`}>
                    {formatMessageTime(message.createdAt)}
                    {message.senderId === authUser._id && (
                      <span className='ml-1'>
                        {message.seen ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center h-full gap-2 text-gray-500'>
            <p className='text-lg font-medium text-white'>No messages yet</p>
            <p className='text-sm'>Say hello to start the conversation!</p>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Message input */}
      <div className='border-t border-stone-500 px-2 md:px-4 py-3'>
        {imagePreview && (
          <div className='relative mb-3'>
            <img
              src={imagePreview}
              alt="Preview"
              className='max-w-[200px] max-h-[200px] rounded-lg'
            />
            <button
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
              className='absolute top-1 right-1 bg-gray-800 rounded-full p-1 hover:bg-gray-700'
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className='flex items-center gap-3 bg-gray-100/12 px-3 rounded-full'>
          <input
            type="text"
            placeholder='Type a message...'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className='flex-1 text-sm p-3 border-none outline-none text-white placeholder-gray-400 bg-transparent'
            disabled={isSending}
          />
          <input
            type="file"
            id="message-image"
            accept='image/*'
            className='hidden'
            onChange={handleImageChange}
            disabled={isSending}
          />
          <label
            htmlFor="message-image"
            className={`cursor-pointer ${isSending ? 'opacity-50' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
          <button
            type="submit"
            disabled={(!newMessage.trim() && !image) || isSending}
            className={`p-2 rounded-full ${(!newMessage.trim() && !image) || isSending 
              ? 'opacity-50 cursor-not-allowed' 
              : 'bg-violet-600 hover:bg-violet-700'}`}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;