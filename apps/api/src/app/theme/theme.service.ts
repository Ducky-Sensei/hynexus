import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ServerService } from '../server/server.service';
import { ServerThemeResponseDto } from './dto/server-theme-response.dto';

@Injectable()
export class ThemeService {
    constructor(
        private readonly serverService: ServerService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getServerTheme(slug: string): Promise<ServerThemeResponseDto> {
        const cacheKey = `theme:server:${slug}`;

        const cached = await this.cacheManager.get<ServerThemeResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const server = await this.serverService.findBySlug(slug);

        if (!server.theme) {
            throw new NotFoundException(`Server '${slug}' does not have a custom theme configured`);
        }

        const response: ServerThemeResponseDto = {
            serverId: server.id,
            serverSlug: server.slug,
            serverName: server.name,
            theme: server.theme,
            createdAt: server.createdAt,
            updatedAt: server.updatedAt,
        };

        await this.cacheManager.set(cacheKey, response, 1800000);

        return response;
    }

    async invalidateServerThemeCache(slug: string): Promise<void> {
        const cacheKey = `theme:server:${slug}`;
        await this.cacheManager.del(cacheKey);
    }
}
