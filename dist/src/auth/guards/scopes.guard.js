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
exports.ScopesGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const roles_decorator_1 = require("../decorators/roles.decorator");
const scopes_decorator_1 = require("../decorators/scopes.decorator");
let ScopesGuard = class ScopesGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const constraints = this.reflector.getAllAndOverride(scopes_decorator_1.SCOPES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? [];
        const request = context
            .switchToHttp()
            .getRequest();
        request.scopeConstraints = constraints;
        if (constraints.length === 0) {
            return true;
        }
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('No se pudo resolver la identidad del usuario.');
        }
        if (this.hasBypassAccess(user.roles, user.scopes)) {
            return true;
        }
        for (const constraint of constraints) {
            const rawValue = this.readValueFromRequest(request, constraint);
            if (rawValue == null) {
                if (constraint.optional) {
                    continue;
                }
                throw new common_1.ForbiddenException(`No se encontro el campo ${constraint.field} para validar el scope.`);
            }
            const targetId = Number(rawValue);
            if (!Number.isInteger(targetId) || targetId <= 0) {
                throw new common_1.ForbiddenException(`El campo ${constraint.field} no contiene un identificador valido para scope.`);
            }
            const resolvedScopeId = await this.resolveScopeId(constraint, targetId);
            if (user.scopes.some((scope) => scope.scopeType === constraint.scopeType &&
                scope.scopeId != null &&
                scope.scopeId === resolvedScopeId)) {
                return true;
            }
        }
        throw new common_1.ForbiddenException('El usuario no posee un scope valido para esta operacion.');
    }
    hasBypassAccess(roles, scopes) {
        if (roles_decorator_1.BYPASS_ROLES.some((role) => roles.includes(role))) {
            return true;
        }
        return scopes.some((scope) => scope.scopeType === client_1.SCOPE.GLOBAL ||
            scope.scopeType === client_1.SCOPE.GRUPO ||
            scope.scopeType === client_1.SCOPE.OWN);
    }
    readValueFromRequest(request, constraint) {
        const source = constraint.source ?? 'body';
        const container = request[source];
        return container?.[constraint.field];
    }
    async resolveScopeId(constraint, targetId) {
        if (constraint.entity === 'AREA') {
            const area = await this.prisma.area.findFirst({
                where: {
                    id: targetId,
                    borrado: false,
                },
                select: { id: true },
            });
            if (!area) {
                throw new common_1.ForbiddenException('El area indicada para el scope no existe.');
            }
            return area.id;
        }
        const rama = await this.prisma.rama.findFirst({
            where: {
                id: targetId,
                borrado: false,
            },
            select: {
                id: true,
                id_area: true,
            },
        });
        if (!rama) {
            throw new common_1.ForbiddenException('La rama indicada para el scope no existe.');
        }
        return constraint.scopeType === client_1.SCOPE.AREA ? rama.id_area : rama.id;
    }
};
exports.ScopesGuard = ScopesGuard;
exports.ScopesGuard = ScopesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], ScopesGuard);
//# sourceMappingURL=scopes.guard.js.map