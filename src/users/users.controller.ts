import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'A user with this email already exists' })
  @Post()
  public async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return await this.usersService.createUser(dto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  public async findUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return await this.usersService.findUserById(id);
  }

  @ApiOperation({ summary: 'Get a list of all users' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user list',
    type: [UserResponseDto],
  })
  @Get()
  public async findAllUsers(): Promise<UserResponseDto[]> {
    return await this.usersService.findAllUsers();
  }
}
