"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtagonistasModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const cuentas_module_1 = require("../cuentas/cuentas.module");
const prisma_module_1 = require("../prisma/prisma.module");
const protagonistas_controller_1 = require("./protagonistas.controller");
const protagonistas_service_1 = require("./protagonistas.service");
let ProtagonistasModule = class ProtagonistasModule {
};
exports.ProtagonistasModule = ProtagonistasModule;
exports.ProtagonistasModule = ProtagonistasModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, cuentas_module_1.CuentasModule, auth_module_1.AuthModule],
        controllers: [protagonistas_controller_1.ProtagonistasController],
        providers: [protagonistas_service_1.ProtagonistasService],
    })
], ProtagonistasModule);
//# sourceMappingURL=protagonistas.module.js.map