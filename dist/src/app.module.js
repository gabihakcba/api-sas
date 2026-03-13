"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adultos_module_1 = require("./adultos/adultos.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const consejos_module_1 = require("./consejos/consejos.module");
const conceptos_pago_module_1 = require("./conceptos-pago/conceptos-pago.module");
const cuentas_module_1 = require("./cuentas/cuentas.module");
const cuentas_dinero_module_1 = require("./cuentas-dinero/cuentas-dinero.module");
const metodos_pago_module_1 = require("./metodos-pago/metodos-pago.module");
const pagos_module_1 = require("./pagos/pagos.module");
const prisma_module_1 = require("./prisma/prisma.module");
const protagonistas_module_1 = require("./protagonistas/protagonistas.module");
const ramas_module_1 = require("./ramas/ramas.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            consejos_module_1.ConsejosModule,
            conceptos_pago_module_1.ConceptosPagoModule,
            cuentas_module_1.CuentasModule,
            cuentas_dinero_module_1.CuentasDineroModule,
            metodos_pago_module_1.MetodosPagoModule,
            pagos_module_1.PagosModule,
            protagonistas_module_1.ProtagonistasModule,
            adultos_module_1.AdultosModule,
            ramas_module_1.RamasModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map