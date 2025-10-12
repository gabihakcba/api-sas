import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { user, password } = loginDto;
    const cuentaValidate = await this.authService.validateUser(user, password);
    if (!cuentaValidate) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const jwt = await this.authService.generateJwt(user);
    return jwt;
  }
}
