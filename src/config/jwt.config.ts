import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET || 'jwt-secret',
    audience: process.env.JWT_TOKEN_AUDIENCE || 'jwt-token-audience',
    issuer: process.env.JWT_TOKEN_ISSUER || 'jwt-token-issuer',
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
    signOptions: {
      expiresIn: process.env.JWT_ACCESS_TOKEN_TTL ?? '3600',
      issuer: process.env.JWT_TOKEN_ISSUER || 'jwt-token-issuer',
      audience: process.env.JWT_TOKEN_AUDIENCE || 'jwt-token-audience',
    },
  };
});
