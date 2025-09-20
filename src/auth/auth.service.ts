import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayloadUserInterface } from './types/jwt-payload-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.saltRounds = Number(this.configService.get<number>('SALT_ROUNDS')) || 10;
  }

  /**
   * Centralized error handler
   */
  private handleError(error: unknown, context: string): never {
    if (error instanceof HttpException) {
      this.logger.error(`[${context}] HttpException: ${error.message}`, error.stack);
      throw error;
    }

    if (error instanceof Error) {
      this.logger.error(`[${context}] Unexpected error: ${error.message}`, error.stack);
    } else {
      this.logger.error(`[${context}] Unknown error: ${JSON.stringify(error)}`);
    }

    throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * Register a new user: hash password, create user and return JWT token
   */
  public async register(dto: RegisterDto): Promise<AuthResponseDto> {
    try {
      /* Email uniqueness verification */
      const existing = await this.usersService.findUserByEmail(dto.email);
      if (existing) {
        this.logger.warn(`Attempt to register with existing email: ${dto.email}`);
        throw new HttpException('A user with this email already exists', HttpStatus.CONFLICT);
      }

      /* Hash the password */
      const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

      /* Create a user */
      const createdUser = await this.usersService.createUser({
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      });

      /* Form JWT payload */
      const payload = {
        sub: createdUser.id,
        email: createdUser.email,
      };

      const token = await this.jwtService.signAsync(payload);
      this.logger.log(`User registered successfully: ${createdUser.id} (${createdUser.email})`);

      return { access_token: token };
    } catch (err: unknown) {
      this.handleError(err, 'register');
    }
  }

  /**
   * Login: validate credentials and return JWT token
   */
  public async login(dto: LoginDto): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.findUserByEmail(dto.email);
      if (!user) {
        this.logger.warn(`Login attempt with unknown email: ${dto.email}`);
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${dto.email}`);
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const payload = {
        sub: user.id,
        email: user.email,
      };

      const token = await this.jwtService.signAsync(payload);
      this.logger.log(`User logged in successfully: ${user.id} (${user.email})`);

      return { access_token: token };
    } catch (err: unknown) {
      this.handleError(err, 'login');
    }
  }

  /**
   * Validate user for JwtStrategy
   * (called automatically when verifying JWT in guards)
   */
  public async validateUserById(userId: string): Promise<JwtPayloadUserInterface | null> {
    try {
      const user = await this.usersService.findUserById(userId);
      if (!user) {
        this.logger.warn(`User not found during validation: ${userId}`);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (err: unknown) {
      this.logger.error(
        `Error validating user by id=${userId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );

      return null;
    }
  }
}
