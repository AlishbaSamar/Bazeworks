import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
