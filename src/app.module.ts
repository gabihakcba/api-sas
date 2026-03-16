import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdultosModule } from './adultos/adultos.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ComisionesModule } from './comisiones/comisiones.module';
import { CalendarioModule } from './calendario/calendario.module';
import { ConsejosModule } from './consejos/consejos.module';
import { ConceptosPagoModule } from './conceptos-pago/conceptos-pago.module';
import { CuentasModule } from './cuentas/cuentas.module';
import { CuentasDineroModule } from './cuentas-dinero/cuentas-dinero.module';
import { EventosModule } from './eventos/eventos.module';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { PagosModule } from './pagos/pagos.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { PlanFormacionModule } from './plan-formacion/plan-formacion.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProtagonistasModule } from './protagonistas/protagonistas.module';
import { RamasModule } from './ramas/ramas.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RelacionesModule } from './relaciones/relaciones.module';
import { ResponsablesModule } from './responsables/responsables.module';
import { TiposEventoModule } from './tipos-evento/tipos-evento.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CalendarioModule,
    AuthModule,
    ComisionesModule,
    ConsejosModule,
    ConceptosPagoModule,
    CuentasModule,
    CuentasDineroModule,
    EventosModule,
    MetodosPagoModule,
    PagosModule,
    PerfilesModule,
    PlanFormacionModule,
    ProtagonistasModule,
    AdultosModule,
    RamasModule,
    RealtimeModule,
    RelacionesModule,
    ResponsablesModule,
    TiposEventoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
