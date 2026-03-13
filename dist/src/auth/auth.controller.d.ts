import { AuthService, UserPayload } from './auth.service';
import { LoginDto } from './dto/login.dto';
interface RequestWithUser extends Request {
    user: UserPayload;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            user: string;
            roles: string[];
            permissions: string[];
            scopes: import("./auth.service").RoleScope[];
        };
    }>;
    getProfile(req: RequestWithUser): UserPayload;
}
export {};
