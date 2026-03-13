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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RamasService = void 0;
const common_1 = require("@nestjs/common");
const scope_filter_service_1 = require("../auth/services/scope-filter.service");
const prisma_service_1 = require("../prisma/prisma.service");
let RamasService = class RamasService {
    prisma;
    scopeFilterService;
    constructor(prisma, scopeFilterService) {
        this.prisma = prisma;
        this.scopeFilterService = scopeFilterService;
    }
    async findAll(user) {
        return this.prisma.rama.findMany({
            where: this.scopeFilterService.mergeWhere({
                borrado: false,
            }, this.scopeFilterService.forRamas(user)),
            orderBy: {
                nombre: 'asc',
            },
            select: {
                id: true,
                nombre: true,
                id_area: true,
            },
        });
    }
};
exports.RamasService = RamasService;
exports.RamasService = RamasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scope_filter_service_1.ScopeFilterService])
], RamasService);
//# sourceMappingURL=ramas.service.js.map