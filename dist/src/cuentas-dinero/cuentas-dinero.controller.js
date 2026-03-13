"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuentasDineroController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const scopes_decorator_1 = require("../auth/decorators/scopes.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const scopes_guard_1 = require("../auth/guards/scopes.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const cuentas_dinero_service_1 = require("./cuentas-dinero.service");
const create_cuenta_dinero_dto_1 = require("./dto/create-cuenta-dinero.dto");
const update_cuenta_dinero_dto_1 = require("./dto/update-cuenta-dinero.dto");
let CuentasDineroController = class CuentasDineroController {
    cuentasDineroService;
    constructor(cuentasDineroService) {
        this.cuentasDineroService = cuentasDineroService;
    }
    async findAll(req, paginationQuery) {
        return this.cuentasDineroService.findAll(req.user, paginationQuery);
    }
    async getOptions(req) {
        return this.cuentasDineroService.getOptions(req.user);
    }
    async findOne(req, id) {
        return this.cuentasDineroService.findOne(id, req.user);
    }
    async create(req, dto) {
        return this.cuentasDineroService.create(dto, req.user);
    }
    async update(req, id, dto) {
        return this.cuentasDineroService.update(id, dto, req.user);
    }
    async remove(req, id) {
        await this.cuentasDineroService.remove(id, req.user);
    }
};
exports.CuentasDineroController = CuentasDineroController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CUENTA_DINERO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], CuentasDineroController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('options'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CUENTA_DINERO'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CuentasDineroController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CUENTA_DINERO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CuentasDineroController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('CREATE:CUENTA_DINERO'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.AREA, entity: 'AREA', field: 'idArea', optional: true }, { scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_cuenta_dinero_dto_1.CreateCuentaDineroDto]),
    __metadata("design:returntype", Promise)
], CuentasDineroController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CUENTA_DINERO'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.AREA, entity: 'AREA', field: 'idArea', optional: true }, { scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_cuenta_dinero_dto_1.UpdateCuentaDineroDto]),
    __metadata("design:returntype", Promise)
], CuentasDineroController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('DELETE:CUENTA_DINERO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CuentasDineroController.prototype, "remove", null);
exports.CuentasDineroController = CuentasDineroController = __decorate([
    (0, common_1.Controller)('cuentas-dinero'),
    __metadata("design:paramtypes", [cuentas_dinero_service_1.CuentasDineroService])
], CuentasDineroController);
//# sourceMappingURL=cuentas-dinero.controller.js.map