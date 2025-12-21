import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Authenticate using email and password to get a JWT.' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } })
  async login(@Body() req) {
    const validUser = await this.authService.validateUser(req.email, req.password);
    if (!validUser) {
        throw new UnauthorizedException();
    }
    return this.authService.login(validUser);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register', description: 'Create a new user. Provide either organizationName (to create new) or invitationToken (to join existing).' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' }, organizationName: { type: 'string' }, invitationToken: { type: 'string' } } } })
  async register(@Body() req) {
    try {
      if (!req.email || !req.password) {
        throw new UnauthorizedException('Email and password are required');
      }
      return await this.authService.register(req.email, req.password, req.organizationName, req.invitationToken);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error; // Re-throw specific errors
    }
    }
  
    @Post('register/invite')
  @ApiOperation({ summary: 'Register via Invite', description: 'Register a new user with an invitation token.' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' }, token: { type: 'string' } } } })
  async registerViaInvite(@Body() req) {
    if (!req.email || !req.password || !req.token) {
        throw new BadRequestException('Email, password, and token are required');
    }
    return await this.authService.registerViaInvite(req.email, req.password, req.token);
  }
}
