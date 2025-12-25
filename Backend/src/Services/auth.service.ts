import { UserService } from './user.service';
import { generateToken, verifyToken } from '../config/jwt.config';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../Models/user.entity';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CustomJWTPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export class AuthService {
  private userService = new UserService();

  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = await this.userService.create(data);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userService.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Validate password
    const isValidPassword = await this.userService.validatePassword(
      user,
      credentials.password
    );

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async googleLogin(token: string): Promise<AuthResponse> {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Invalid Google Token');
    }

    const { email, name, sub } = payload;

    // Check if user exists
    let user = await this.userService.findByEmail(email);

    if (!user) {
      // Create new user (Generate a random password since they use Google)
      // Note: In a real app, you'd mark them as google-auth users to prevent password login without setting one
      user = await this.userService.create({
        email,
        name: name || 'Google User',
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      });
    }

    // Generate JWT
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    return {
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async validateToken(token: string): Promise<string | JwtPayload> {
    return verifyToken(token);
  }

  async getCurrentUser(userId: number): Promise<User | null> {
    return this.userService.getById(userId);
  }
}