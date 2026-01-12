import type { ServerResponseDto } from './server.dto';
import type { Server } from './server.entity';

/**
 * Mapper functions to convert Server entities to DTOs
 * This decouples the API response from the database schema
 */
export const ServerMapper = {
    /**
     * Converts a Server entity to a ServerResponseDto
     * @param entity The Server entity from the database
     * @returns The ServerResponseDto for API responses
     */
    toDto(entity: Server): ServerResponseDto {
        return {
            id: entity.id,
            ownerId: entity.ownerId,
            slug: entity.slug,
            name: entity.name,
            ipAddress: entity.ipAddress,
            port: entity.port,
            description: entity.description,
            websiteUrl: entity.websiteUrl,
            discordUrl: entity.discordUrl,
            bannerUrl: entity.bannerUrl,
            logoUrl: entity.logoUrl,
            category: entity.category as any,
            region: entity.region as any,
            language: entity.language,
            maxPlayers: entity.maxPlayers,
            currentPlayers: entity.currentPlayers,
            status: entity.status as any,
            isOnline: entity.isOnline,
            lastPing: entity.lastPing,
            verified: entity.verified,
            featured: entity.featured,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    },

    /**
     * Converts an array of Server entities to ServerResponseDtos
     * @param entities Array of Server entities from the database
     * @returns Array of ServerResponseDtos for API responses
     */
    toDtoArray(entities: Server[]): ServerResponseDto[] {
        return entities.map((entity) => ServerMapper.toDto(entity));
    },
} as const;
