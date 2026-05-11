import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { InfluencerProfile } from "../models/InfluencerProfile";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest, JwtPayload, UserRole } from "../types";

const signToken = (userId: string, role: UserRole, email: string): string => {
  return jwt.sign(
    { userId, role, email } as JwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any }
  );
};

const signRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "30d") as any }
  );
};

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return next(new AppError("All fields are required", 400));
    }

    if (!["business", "influencer"].includes(role)) {
      return next(new AppError("Role must be business or influencer", 400));
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError("Email already registered", 409));
    }

    const user = await User.create({ name, email, password, role });

    // Auto-create influencer profile stub
    if (role === "influencer") {
      await InfluencerProfile.create({
        user: user._id,
        niche: ["Unspecified"], // Passes "At least one niche is required" validation
        location: "",
        country: "",
        bio: "",
        platforms: {},
      });
    }

    const token = signToken(user._id.toString(), user.role, user.email);
    const refreshToken = signRefreshToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return next(new AppError("Email, password, and role are required", 400));
    }

    // Explicitly select password since it's hidden by default
    const user = await User.findOne({ email, role }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid credentials", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Account has been deactivated", 403));
    }

    const token = signToken(user._id.toString(), user.role, user.email);
    const refreshToken = signRefreshToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
        },
        token,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return next(new AppError("Refresh token required", 400));

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string
    ) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) return next(new AppError("User not found", 404));

    const newToken = signToken(user._id.toString(), user.role, user.email);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { token: newToken },
    });
  } catch {
    next(new AppError("Invalid or expired refresh token", 401));
  }
};

// GET /api/auth/me
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return next(new AppError("User not found", 404));

    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
