import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayloadInterface } from '../types/jwt-payload.interface';
import { JwtPayloadUserInterface } from '../types/jwt-payload-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
      audience: configService.get<string>('jwt.audience'),
      issuer: configService.get<string>('jwt.issuer'),
    });
  }

  /**
   * Validate method is called automatically by Passport
   */
  public async validate(payload: JwtPayloadInterface): Promise<JwtPayloadUserInterface> {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      this.logger.warn(`JWT validation failed for userId=${payload.sub}`);
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
