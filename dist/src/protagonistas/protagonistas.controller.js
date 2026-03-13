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
exports.ProtagonistasController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const scopes_decorator_1 = require("../auth/decorators/scopes.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const scopes_guard_1 = require("../auth/guards/scopes.guard");
const create_protagonista_dto_1 = require("./dto/create-protagonista.dto");
const protagonista_pase_dto_1 = require("./dto/protagonista-pase.dto");
const protagonistas_service_1 = require("./protagonistas.service");
const update_protagonista_dto_1 = require("./dto/update-protagonista.dto");
let ProtagonistasController = class ProtagonistasController {
    protagonistasService;
    constructor(protagonistasService) {
        this.protagonistasService = protagonistasService;
    }
    async findAll(req, paginationQuery) {
        return this.protagonistasService.findAll(req.user, paginationQuery);
    }
    async findOne(req, id) {
        return this.protagonistasService.findOne(id, req.user);
    }
    async create(dto) {
        return this.protagonistasService.create(dto);
    }
    async update(id, dto, req) {
        return this.protagonistasService.update(id, dto, req.user);
    }
    async registerPase(id, dto, req) {
        return this.protagonistasService.registerPase(id, dto, req.user);
    }
    async remove(id, req) {
        await this.protagonistasService.remove(id, req.user);
    }
};
exports.ProtagonistasController = ProtagonistasController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:MIEMBRO', 'READ:PROTAGONISTA'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], ProtagonistasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:MIEMBRO', 'READ:PROTAGONISTA'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ProtagonistasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('CREATE:MIEMBRO', 'CREATE:PROTAGONISTA'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama' }, { scopeType: client_1.SCOPE.AREA, entity: 'RAMA', field: 'idRama' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_protagonista_dto_1.CreateProtagonistaDto]),
    __metadata("design:returntype", Promise)
], ProtagonistasController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:MIEMBRO', 'UPDATE:PROTAGONISTA'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true }, { scopeType: client_1.SCOPE.AREA, entity: 'RAMA', field: 'idRama', optional: true }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_protagonista_dto_1.UpdateProtagonistaDto, Object]),
    __metadata("design:returntype", Promise)
], ProtagonistasController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/pase'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, scopes_guard_1.ScopesGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:MIEMBRO', 'UPDATE:PROTAGONISTA'),
    (0, scopes_decorator_1.ScopeAccess)({ scopeType: client_1.SCOPE.RAMA, entity: 'RAMA', field: 'idRama' }, { scopeType: client_1.SCOPE.AREA, entity: 'RAMA', field: 'idRama' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, protagonista_pase_dto_1.ProtagonistaPaseDto, Object]),
    __metadata("design:returntype", Promise)
], ProtagonistasController.prototype, "registerPase", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('DELETE:MIEMBRO', 'DELETE:PROTAGONISTA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProtagonistasController.prototype, "remove", null);
exports.ProtagonistasController = ProtagonistasController = __decorate([
    (0, common_1.Controller)('protagonistas'),
    __metadata("design:paramtypes", [protagonistas_service_1.ProtagonistasService])
], ProtagonistasController);
//# sourceMappingURL=protagonistas.controller.js.map