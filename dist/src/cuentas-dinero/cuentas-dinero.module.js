"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuentasDineroModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const prisma_module_1 = require("../prisma/prisma.module");
const cuentas_dinero_controller_1 = require("./cuentas-dinero.controller");
const cuentas_dinero_service_1 = require("./cuentas-dinero.service");
let CuentasDineroModule = class CuentasDineroModule {
};
exports.CuentasDineroModule = CuentasDineroModule;
exports.CuentasDineroModule = CuentasDineroModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [cuentas_dinero_controller_1.CuentasDineroController],
        providers: [cuentas_dinero_service_1.CuentasDineroService],
    })
], CuentasDineroModule);
//# sourceMappingURL=cuentas-dinero.module.js.map