import express from 'express';
import userController from '../controllers/user.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', userController.getAllUsers); 

router.put('/:id', userController.updateUserRole); 
router.delete('/:id', userController.deleteUser); 

export default router;
