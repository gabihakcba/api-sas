"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptedScopes = exports.ScopeAccess = exports.SCOPES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.SCOPES_KEY = 'scopeConstraints';
const ScopeAccess = (...constraints) => (0, common_1.SetMetadata)(exports.SCOPES_KEY, [...constraints]);
exports.ScopeAccess = ScopeAccess;
exports.AcceptedScopes = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.scopeConstraints ?? [];
});
//# sourceMappingURL=scopes.decorator.js.map