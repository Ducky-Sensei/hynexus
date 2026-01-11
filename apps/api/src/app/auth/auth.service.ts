import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RbacService } from '../rbac/rbac.service';
import { User } from '../user/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthProfileDto } from './dto/oauth-profile.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenService } from './services/refresh-token.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly rbacService: RbacService,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    async register(registerDto: RegisterDto, req?: any): Promise<AuthResponseDto> {
        const { email, password, name, username } = registerDto;

        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const existingUsername = await this.userRepository.findOne({
            where: { username },
        });

        if (existingUsername) {
            throw new ConflictException('Username is already taken');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            name,
            username,
            isActive: true,
            authProvider: 'password',
            lastLogin: new Date(),
        });

        // Assign default 'user' role
        const userRole = await this.rbacService.findRoleByName('user');
        if (userRole) {
            user.roles = [userRole];
        }

        await this.userRepository.save(user);

        const accessToken = this.generateToken(user);
        const refreshToken = await this.refreshTokenService.createRefreshToken(
            user,
            req?.headers?.['user-agent'],
            req?.ip,
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                authProvider: user.authProvider,
            },
        };
    }

    async login(loginDto: LoginDto, req?: any): Promise<AuthResponseDto> {
        const { email, password } = loginDto;

        const user = await this.userRepository.findOne({
            where: { email },
            relations: ['roles', 'roles.permissions'],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.password) {
            throw new UnauthorizedException(
                'This account uses OAuth. Please sign in with your OAuth provider.',
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is not active');
        }

        if (user.isBanned) {
            throw new UnauthorizedException('Account has been banned');
        }

        user.lastLogin = new Date();
        await this.userRepository.save(user);

        const accessToken = this.generateToken(user);
        const refreshToken = await this.refreshTokenService.createRefreshToken(
            user,
            req?.headers?.['user-agent'],
            req?.ip,
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                authProvider: user.authProvider,
            },
        };
    }

    async validateUser(userId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId, isActive: true },
            relations: ['roles', 'roles.permissions'],
        });
    }

    /**
     * Find or create user from OAuth profile (with account linking)
     */
    async findOrCreateOAuthUser(profile: OAuthProfileDto): Promise<User> {
        let user = await this.userRepository.findOne({
            where: {
                authProvider: profile.provider,
                authProviderId: profile.providerId,
            },
            relations: ['roles', 'roles.permissions'],
        });

        if (user) {
            user.authProviderData = profile.profileData;
            user.name = profile.name || user.name;
            await this.userRepository.save(user);
            return user;
        }

        user = await this.userRepository.findOne({
            where: { email: profile.email },
            relations: ['roles', 'roles.permissions'],
        });

        if (user) {
            user.authProvider = profile.provider;
            user.authProviderId = profile.providerId;
            user.authProviderData = profile.profileData;
            await this.userRepository.save(user);
            return user;
        }

        const userRole = await this.rbacService.findRoleByName('user');

        const baseUsername =
            profile.name?.replace(/\s+/g, '_').toLowerCase() || profile.email.split('@')[0];
        const username = await this.generateUniqueUsername(baseUsername);

        user = this.userRepository.create({
            email: profile.email,
            name: profile.name,
            username,
            authProvider: profile.provider,
            authProviderId: profile.providerId,
            authProviderData: profile.profileData,
            isActive: true,
            password: null,
            lastLogin: new Date(),
            roles: userRole ? [userRole] : [],
        });

        await this.userRepository.save(user);

        return user;
    }

    /**
     * Generate unique username by appending numbers if needed
     */
    private async generateUniqueUsername(baseUsername: string): Promise<string> {
        let cleanUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '_');

        if (cleanUsername.length < 3) {
            cleanUsername = `user_${cleanUsername}`;
        }

        cleanUsername = cleanUsername.substring(0, 20);

        let username = cleanUsername;
        let counter = 1;

        while (await this.userRepository.findOne({ where: { username } })) {
            const suffix = `_${counter}`;
            username = cleanUsername.substring(0, 20 - suffix.length) + suffix;
            counter++;
        }

        return username;
    }

    /**
     * Generate new access token from refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<AuthResponseDto> {
        const user = await this.refreshTokenService.validateRefreshToken(refreshToken);

        const accessToken = this.generateToken(user);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                authProvider: user.authProvider,
            },
        };
    }

    /**
     * Revoke refresh token (logout)
     */
    async logout(refreshToken: string): Promise<void> {
        await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }

    private generateToken(user: User): string {
        const roles = user.roles?.map((role) => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions?.map((p) => ({
                resource: p.resource,
                action: p.action,
            })),
        }));

        const payload = {
            sub: user.id,
            email: user.email,
            roles: roles || [],
        };

        return this.jwtService.sign(payload);
    }
}
