import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware to process uploaded files
export const processUpload = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chat-app/messages',
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto'
    });

    // Attach Cloudinary URL to request body
    req.body.imageUrl = result.secure_url;
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image to Cloudinary'
    });
  } finally {
    // Clean up temporary file
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
  }
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [users, total] = await Promise.all([
      User.find({ _id: { $ne: userId } })
        .select("-password")
        .sort({ lastSeen: -1 }),
      User.countDocuments({ _id: { $ne: userId } })
    ]);

    const userMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: { $in: users.map(u => u._id) }, receiverId: userId },
            { senderId: userId, receiverId: { $in: users.map(u => u._id) } }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$receiverId",
              "$senderId"
            ]
          },
          unseenCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$senderId", userId] },
                  { $eq: ["$seen", false] }
                ]},
                1,
                0
              ]
            }
          },
          lastMessage: { $last: "$$ROOT" }
        }
      }
    ]);

    const usersWithMessages = users.map(user => {
      const messageData = userMessages.find(m => m._id.equals(user._id));
      return {
        ...user.toObject(),
        unseenCount: messageData?.unseenCount || 0,
        lastMessage: messageData?.lastMessage || null
      };
    });

    res.status(200).json({ 
      success: true, 
      users: usersWithMessages,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch users",
      error: error.message 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    // Validate if other user exists
    const otherUser = await User.findById(otherUserId).select("_id");
    if (!otherUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as seen
    await Message.updateMany(
      { 
        senderId: otherUserId, 
        receiverId: myId, 
        seen: false 
      },
      { 
        $set: { 
          seen: true,
          seenAt: new Date() 
        } 
      }
    );

    res.json({ 
      success: true, 
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch messages",
      error: error.message 
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const imageUrl = req.body.imageUrl; // From processUpload middleware
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (!text && !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "Message must contain text or image" 
      });
    }

    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) {
      return res.status(404).json({ 
        success: false, 
        message: "Receiver not found" 
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text?.trim() || null,
      image: imageUrl || null
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'fullName profilePic')
      .populate('receiverId', 'fullName profilePic');

    // Emit socket events
    const receiverSocketId = userSocketMap[receiverId];
    const senderSocketId = userSocketMap[senderId];
    
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", populatedMessage);
    if (senderSocketId) io.to(senderSocketId).emit("newMessage", populatedMessage);

    // Update last message timestamp
    await User.updateMany(
      { _id: { $in: [senderId, receiverId] } },
      { $set: { lastMessageAt: new Date() } }
    );

    res.status(201).json({ 
      success: true, 
      message: populatedMessage 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send message",
      error: error.message 
    });
  }
};

export const markMessageSeen = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate('senderId', 'fullName profilePic')
      .populate('receiverId', 'fullName profilePic');

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    if (message.receiverId._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to mark this message" 
      });
    }

    if (!message.seen) {
      message.seen = true;
      message.seenAt = new Date();
      await message.save();

      const senderSocketId = userSocketMap[message.senderId._id];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSeen", {
          messageId: message._id,
          seenAt: message.seenAt
        });
      }
    }

    res.json({ 
      success: true, 
      message: "Message marked as seen",
      seenAt: message.seenAt 
    });
  } catch (error) {
    console.error('Mark message seen error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark message as seen",
      error: error.message 
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this message" 
      });
    }

    // Delete image from Cloudinary if exists
    if (message.image) {
      try {
        const publicId = message.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    await Message.deleteOne({ _id: messageId });

    // Notify both users
    const senderSocketId = userSocketMap[userId];
    const receiverSocketId = userSocketMap[message.receiverId];
    
    if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", messageId);
    if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", messageId);

    res.json({ 
      success: true, 
      message: "Message deleted successfully" 
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete message",
      error: error.message 
    });
  }
};