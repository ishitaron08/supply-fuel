import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken, generateOTP } from '../utils/helpers';
import { sendOTPEmail } from '../services/emailService';
import config from '../config';
import { OTP_EXPIRY_MINUTES } from 'shared';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, profileType, organizationName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      profileType,
      organizationName,
      otp,
      otpExpiry,
    });

    await sendOTPEmail(email, name, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      data: { userId: user._id, email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'Account already verified.' });
      return;
    }

    if (!user.otp || !user.otpExpiry) {
      res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
      return;
    }

    if (user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP.' });
      return;
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const refreshToken = generateRefreshToken({ id: user._id.toString() });

    res.json({
      success: true,
      message: 'Account verified successfully.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileType: user.profileType,
          organizationName: user.organizationName,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (!user.isVerified) {
      // Resend OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      await sendOTPEmail(email, user.name, otp);

      res.status(403).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.',
        data: { requiresVerification: true, email },
      });
      return;
    }

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const refreshToken = generateRefreshToken({ id: user._id.toString() });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileType: user.profileType,
          organizationName: user.organizationName,
          address: user.address,
          city: user.city,
          state: user.state,
          gstNumber: user.gstNumber,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required.' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtRefreshSecret) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid refresh token.' });
      return;
    }

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: 'No account found with this email.' });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, user.name, otp);

    res.json({ success: true, message: 'Password reset OTP has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpiry');

    if (!user || !user.otp || !user.otpExpiry) {
      res.status(400).json({ success: false, message: 'Invalid request.' });
      return;
    }

    if (user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: 'OTP has expired.' });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP.' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
