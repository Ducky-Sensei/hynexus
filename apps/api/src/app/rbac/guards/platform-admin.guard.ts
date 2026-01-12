import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { User } from '../../user/user.entity';

/**
 * Platform Admin Guard
 * Ensures only the platform administrator (website owner) can access protected endpoints
 * This is separate from server ownership - platform admin moderates the entire site
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user: User = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        if (!user.isAdmin) {
            throw new ForbiddenException(
                'Access denied: Platform administrator privileges required',
            );
        }

        return true;
    }
}
