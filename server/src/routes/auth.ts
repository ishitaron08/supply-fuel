import { Router } from 'express';
import { register, login, verifyOTP, refreshToken, forgotPassword, resetPassword } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
