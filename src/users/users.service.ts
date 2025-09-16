import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

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
      this.logger.error(`[${context}] Unknown error:`, JSON.stringify(error));
    }

    throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * Create new user
   */
  public async createUser(dto: CreateUserDto): Promise<UserEntity> {
    try {
      /* Checking for uniqueness */
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        this.logger.warn(`Attempt to create user with existing email: ${dto.email}`);
        throw new HttpException('A user with this email already exists', HttpStatus.CONFLICT);
      }

      const user = this.userRepository.create({
        name: dto.name,
        email: dto.email,
        passwordHash: dto.password, // TODO: Later replace with bcrypt.hash ()
      });

      const saved = await this.userRepository.save(user);
      this.logger.log(`User created successfully: ${saved.id} (${saved.email})`);

      return saved;
    } catch (err: unknown) {
      this.handleError(err, 'createUser');
    }
  }

  /**
   * Find user by id
   */
  public async findUserById(id: string): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found (id: ${id})`);
        throw new HttpException(`User with id=${id} not found`, HttpStatus.NOT_FOUND);
      }

      this.logger.log(`User found: ${user.id} (${user.email})`);
      return user;
    } catch (err: unknown) {
      this.handleError(err, 'findUserById');
    }
  }

  /**
   * Find user by email
   */
  public async findUserByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        this.logger.log(`User found by email: ${email}`);
      } else {
        this.logger.warn(`User not found at email: ${email}`);
      }

      return user;
    } catch (err: unknown) {
      this.handleError(err, 'findUserByEmail');
    }
  }

  /**
   * Get all users
   */
  public async findAllUsers(): Promise<UserEntity[]> {
    try {
      const users = await this.userRepository.find();
      this.logger.log(`Users found: ${users.length}`);
      return users;
    } catch (err: unknown) {
      this.handleError(err, 'findAllUsers');
    }
  }
}
