import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService, TokenPair } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, tokens: TokenPair) {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      expires: tokens.refreshTokenExpiresAt,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.signup(
      dto.fullName,
      dto.email,
      dto.password,
    );
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validatedUser = await this.authService.validateUser(
      dto.email,
      dto.password,
    );
    const { user, tokens } = await this.authService.login(validatedUser);
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(rawRefreshToken);
    this.clearRefreshCookie(res);
    return { loggedOut: true };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No session found');
    }
    const { user, tokens } = await this.authService.refresh(rawRefreshToken);
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.authService.publicUser(user);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google; body never runs.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const { tokens } = await this.authService.login(user);
    this.setRefreshCookie(res, tokens);
    const webAppUrl = this.config.get<string>('WEB_APP_URL');
    res.redirect(`${webAppUrl}/oauth/callback#access_token=${tokens.accessToken}`);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubAuth() {
    // Guard redirects to GitHub; body never runs.
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const { tokens } = await this.authService.login(user);
    this.setRefreshCookie(res, tokens);
    const webAppUrl = this.config.get<string>('WEB_APP_URL');
    res.redirect(`${webAppUrl}/oauth/callback#access_token=${tokens.accessToken}`);
  }
}
