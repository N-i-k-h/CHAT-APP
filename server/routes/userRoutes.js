import express from 'express';
import { 
  signup, 
  login, 
  checkAuth,
  updateProfile 
} from '../controllers/userController.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/check-auth', protectRoute, checkAuth);
router.put('/update-profile', protectRoute, updateProfile);

export default router;