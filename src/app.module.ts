import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdultosModule } from './adultos/adultos.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConsejosModule } from './consejos/consejos.module';
import { ConceptosPagoModule } from './conceptos-pago/conceptos-pago.module';
import { CuentasModule } from './cuentas/cuentas.module';
import { CuentasDineroModule } from './cuentas-dinero/cuentas-dinero.module';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { PagosModule } from './pagos/pagos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProtagonistasModule } from './protagonistas/protagonistas.module';
import { RamasModule } from './ramas/ramas.module';
import { RelacionesModule } from './relaciones/relaciones.module';
import { ResponsablesModule } from './responsables/responsables.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ConsejosModule,
    ConceptosPagoModule,
    CuentasModule,
    CuentasDineroModule,
    MetodosPagoModule,
    PagosModule,
    ProtagonistasModule,
    AdultosModule,
    RamasModule,
    RelacionesModule,
    ResponsablesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
