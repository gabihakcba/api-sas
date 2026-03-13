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
exports.ConceptosPagoController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const conceptos_pago_service_1 = require("./conceptos-pago.service");
const create_concepto_pago_dto_1 = require("./dto/create-concepto-pago.dto");
const update_concepto_pago_dto_1 = require("./dto/update-concepto-pago.dto");
let ConceptosPagoController = class ConceptosPagoController {
    conceptosPagoService;
    constructor(conceptosPagoService) {
        this.conceptosPagoService = conceptosPagoService;
    }
    async findAll(paginationQuery) {
        return this.conceptosPagoService.findAll(paginationQuery);
    }
    async findOne(id) {
        return this.conceptosPagoService.findOne(id);
    }
    async create(dto) {
        return this.conceptosPagoService.create(dto);
    }
    async update(id, dto) {
        return this.conceptosPagoService.update(id, dto);
    }
    async remove(id) {
        await this.conceptosPagoService.remove(id);
    }
};
exports.ConceptosPagoController = ConceptosPagoController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONCEPTO_PAGO'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], ConceptosPagoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('READ:CONCEPTO_PAGO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConceptosPagoController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('CREATE:CONCEPTO_PAGO'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_concepto_pago_dto_1.CreateConceptoPagoDto]),
    __metadata("design:returntype", Promise)
], ConceptosPagoController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('UPDATE:CONCEPTO_PAGO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_concepto_pago_dto_1.UpdateConceptoPagoDto]),
    __metadata("design:returntype", Promise)
], ConceptosPagoController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.CheckPermissions)('DELETE:CONCEPTO_PAGO'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConceptosPagoController.prototype, "remove", null);
exports.ConceptosPagoController = ConceptosPagoController = __decorate([
    (0, common_1.Controller)('conceptos-pago'),
    __metadata("design:paramtypes", [conceptos_pago_service_1.ConceptosPagoService])
], ConceptosPagoController);
//# sourceMappingURL=conceptos-pago.controller.js.map