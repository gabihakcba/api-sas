import { Strategy } from 'passport-jwt';
import { SCOPE } from '@prisma/client';
interface JwtPayload {
    sub: number;
    username: string;
    roles: string[];
    permissions: string[];
    scopes: Array<{
        role: string;
        scopeType: SCOPE;
        scopeId: number | null;
    }>;
    iat: number;
    exp: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): {
        userId: number;
        username: string;
        roles: string[];
        permissions: string[];
        scopes: {
            role: string;
            scopeType: SCOPE;
            scopeId: number | null;
        }[];
    };
}
export {};
