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
exports.ConsejosController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const consejos_service_1 = require("./consejos.service");
const create_consejo_dto_1 = require("./dto/create-consejo.dto");
const update_consejo_dto_1 = require("./dto/update-consejo.dto");
const create_temario_consejo_dto_1 = require("./dto/create-temario-consejo.dto");
const update_temario_consejo_dto_1 = require("./dto/update-temario-consejo.dto");
const consejo_asistencia_options_query_dto_1 = require("./dto/consejo-asistencia-options-query.dto");
const create_asistencia_consejo_dto_1 = require("./dto/create-asistencia-consejo.dto");
let ConsejosController = class ConsejosController {
    consejosService;
    constructor(consejosService) {
        this.consejosService = consejosService;
    }
    async findAll(req, paginationQuery) {
        return this.consejosService.findAll(req.user, paginationQuery);
    }
    async findOne(req, id) {
        return this.consejosService.findOne(id, req.user);
    }
    async findTemario(req, id) {
        return this.consejosService.findTemario(id, req.user);
    }
    async findAsistencias(id) {
        return this.consejosService.findAsistencias(id);
    }
    async getAsistenciaOptions(id, query) {
        return this.consejosService.getAsistenciaOptions(id, query);
    }
    async exportPdf(req, id, res) {
        const file = await this.consejosService.exportPdf(id, req.user, true);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.buffer);
    }
    async exportPdfPublic(req, id, res) {
        const file = await this.consejosService.exportPdf(id, req.user, false);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.buffer);
    }
    async create(dto) {
        return this.consejosService.create(dto);
    }
    async createTemario(id, dto) {
        return this.consejosService.createTemario(id, dto);
    }
    async createAsistencia(id, dto) {
        return this.consejosService.createAsistencia(id, dto);
    }
    async update(id, dto) {
        return this.consejosService.update(id, dto);
    }
    async updateTemario(id, temarioId, dto) {
        return this.consejosService.updateTemario(id, temarioId, dto);
    }
    async remove(id) {
        await this.consejosService.remove(id);
    }
    async removeTemario(id, temarioId) {
        await this.consejosService.removeTemario(id, temarioId);
    }
};
exports.ConsejosController = ConsejosController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/temario'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "findTemario", null);
__decorate([
    (0, common_1.Get)(':id/asistencias'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "findAsistencias", null);
__decorate([
    (0, common_1.Get)(':id/asistencias/options'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, consejo_asistencia_options_query_dto_1.ConsejoAsistenciaOptionsQueryDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "getAsistenciaOptions", null);
__decorate([
    (0, common_1.Get)(':id/export/pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Get)(':id/export/pdf-publico'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONSEJO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "exportPdfPublic", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('CREATE:CONSEJO'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_consejo_dto_1.CreateConsejoDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/temario'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_temario_consejo_dto_1.CreateTemarioConsejoDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "createTemario", null);
__decorate([
    (0, common_1.Post)(':id/asistencias'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_asistencia_consejo_dto_1.CreateAsistenciaConsejoDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "createAsistencia", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_consejo_dto_1.UpdateConsejoDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/temario/:temarioId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('temarioId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_temario_consejo_dto_1.UpdateTemarioConsejoDto]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "updateTemario", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('DELETE:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(':id/temario/:temarioId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CONSEJO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('temarioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ConsejosController.prototype, "removeTemario", null);
exports.ConsejosController = ConsejosController = __decorate([
    (0, common_1.Controller)('consejos'),
    __metadata("design:paramtypes", [consejos_service_1.ConsejosService])
], ConsejosController);
//# sourceMappingURL=consejos.controller.js.map