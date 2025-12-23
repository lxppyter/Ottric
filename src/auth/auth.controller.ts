import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Response, Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request Password Recovery' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
  async forgotPassword(@Body() req) {
    if (!req.email) {
        throw new BadRequestException('Email is required');
    }
    return await this.authService.forgotPassword(req.email);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate using email and password to get a JWT.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string' }, password: { type: 'string' } },
    },
  })
  async login(@Body() req, @Res({ passthrough: true }) res: Response) {
    const validUser = await this.authService.validateUser(
      req.email,
      req.password,
    );
    if (!validUser) {
      throw new UnauthorizedException();
    }
    const { access_token, refresh_token } = await this.authService.login(validUser);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // or 'lax' depending on frontend requirements
      path: '/auth', // Only sent to auth endpoints
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { access_token };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh Access Token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.authService.refresh(refreshToken);
    
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: tokens.access_token };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
      const refreshToken = req.cookies['refresh_token'];
      if (refreshToken) {
          await this.authService.revokeRefreshToken(refreshToken);
      }
      res.clearCookie('refresh_token', { path: '/auth' });
      return { message: 'Logged out successfully' };
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register',
    description:
      'Create a new user. Provide either organizationName (to create new) or invitationToken (to join existing).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        organizationName: { type: 'string' },
        invitationToken: { type: 'string' },
      },
    },
  })
  async register(@Body() req) {
    try {
      if (!req.email || !req.password) {
        throw new UnauthorizedException('Email and password are required');
      }
      return await this.authService.register(
        req.email,
        req.password,
        req.organizationName,
        req.invitationToken,
      );
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error; // Re-throw specific errors
    }
  }

  @Post('register/invite')
  @ApiOperation({
    summary: 'Register via Invite',
    description: 'Register a new user with an invitation token.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        token: { type: 'string' },
      },
    },
  })
  async registerViaInvite(@Body() req) {
    if (!req.email || !req.password || !req.token) {
      throw new BadRequestException('Email, password, and token are required');
    }
    return await this.authService.registerViaInvite(
      req.email,
      req.password,
      req.token,
    );
  }
}
