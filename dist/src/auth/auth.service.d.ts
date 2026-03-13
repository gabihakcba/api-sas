import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SCOPE } from '@prisma/client';
export interface RoleScope {
    role: string;
    scopeType: SCOPE;
    scopeId: number | null;
}
export interface UserPayload {
    id: number;
    user: string;
    roles: string[];
    permissions: string[];
    scopes: RoleScope[];
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(loginDto: LoginDto): Promise<UserPayload>;
    private normalizeAdultReadPermissions;
    private normalizeMemberCajaPermissions;
    login(user: UserPayload): {
        access_token: string;
        user: {
            id: number;
            user: string;
            roles: string[];
            permissions: string[];
            scopes: RoleScope[];
        };
    };
}
