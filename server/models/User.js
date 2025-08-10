import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  bio: { type: String, default: '' },
  profilePic: { type: String, default: '' },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);