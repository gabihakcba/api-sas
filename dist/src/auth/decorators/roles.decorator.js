"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptedRoles = exports.Roles = exports.BYPASS_ROLES = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'acceptedRoles';
exports.BYPASS_ROLES = ['ADM', 'OWN', 'JEFATURA'];
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, [...roles]);
exports.Roles = Roles;
exports.AcceptedRoles = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.acceptedRoles ?? [];
});
//# sourceMappingURL=roles.decorator.js.map