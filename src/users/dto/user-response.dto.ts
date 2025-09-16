import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Username' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  public static fromEntity(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
