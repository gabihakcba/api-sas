import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CuentaModule } from '../cuenta/cuenta.module';
import { AuthGuard } from './guards/auth.guard';

@Global()
@Module({
  imports: [CuentaModule],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule { }
