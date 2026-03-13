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
exports.AdultosController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const scopes_decorator_1 = require("../auth/decorators/scopes.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const scopes_guard_1 = require("../auth/guards/scopes.guard");
const adultos_service_1 = require("./adultos.service");
const create_adulto_dto_1 = require("./dto/create-adulto.dto");
const update_adulto_dto_1 = require("./dto/update-adulto.dto");
let AdultosController = class AdultosController {
    adultosService;
    constructor(adultosService) {
        this.adultosService = adultosService;
    }
    async findAll(req, paginationQuery) {
        return this.adultosService.findAll(req.user, paginationQuery);
    }
    async getOptions(req) {
        return this.adultosService.getOptions(req.user);
    }
    async findOne(req, id) {
        return this.adultosService.findOne(id, req.user);
    }
    async create(dto) {
        return this.adultosService.create(dto);
    }
    async update(id, dto, req) {
        return this.adultosService.update(id, dto, req.user);
    }
    async remove(id, req) {
        await this.adultosService.remove(id, req.user);
    }
};
exports.AdultosController = AdultosController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:MIEMBRO', 'READ:ADULTO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], AdultosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('options'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:MIEMBRO', 'READ:ADULTO'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdultosController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:MIEMBRO', 'READ:ADULTO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AdultosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('CREATE:MIEMBRO', 'CREATE:ADULTO'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.AREA, entity: 'AREA', field: 'idArea' }, { scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_adulto_dto_1.CreateAdultoDto]),
    __metadata("design:returntype", Promise)
], AdultosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:MIEMBRO', 'UPDATE:ADULTO'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.AREA, entity: 'AREA', field: 'idArea', optional: true }, { scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_adulto_dto_1.UpdateAdultoDto, Object]),
    __metadata("design:returntype", Promise)
], AdultosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('DELETE:MIEMBRO', 'DELETE:ADULTO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdultosController.prototype, "remove", null);
exports.AdultosController = AdultosController = __decorate([
    (0, common_1.Controller)('adultos'),
    __metadata("design:paramtypes", [adultos_service_1.AdultosService])
], AdultosController);
//# sourceMappingURL=adultos.controller.js.map