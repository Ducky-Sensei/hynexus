import type { Theme } from '@hynexus/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    Length,
    Max,
    Min,
} from 'class-validator';

export enum ServerCategory {
    SURVIVAL = 'Survival',
    PVP = 'PvP',
    CREATIVE = 'Creative',
    MINIGAMES = 'Minigames',
    RPG = 'RPG',
    ROLEPLAY = 'Roleplay',
    ANARCHY = 'Anarchy',
}

export enum ServerRegion {
    NA = 'NA',
    EU = 'EU',
    ASIA = 'Asia',
    OCEANIA = 'Oceania',
    SA = 'SA',
}

export enum ServerStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
}

/**
 * DTO for creating a new server listing
 */
export class CreateServerDto {
    @ApiProperty({
        description: 'Server name',
        example: 'Epic Survival Server',
        minLength: 3,
        maxLength: 100,
    })
    @IsString()
    @Length(3, 100)
    name: string;

    @ApiProperty({
        description: 'Server IP address or hostname',
        example: 'play.epicserver.com',
        maxLength: 255,
    })
    @IsString()
    @Length(1, 255)
    ipAddress: string;

    @ApiPropertyOptional({
        description: 'Server port (default: 3000 for Hytale)',
        example: 3000,
        default: 3000,
        minimum: 1,
        maximum: 65535,
    })
    @IsInt()
    @Min(1)
    @Max(65535)
    @IsOptional()
    port?: number;

    @ApiProperty({
        description: 'Server description (supports markdown)',
        example: 'A friendly survival server with custom plugins and active community!',
        minLength: 50,
        maxLength: 5000,
    })
    @IsString()
    @Length(50, 5000)
    description: string;

    @ApiPropertyOptional({
        description: 'Server website URL',
        example: 'https://epicserver.com',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    websiteUrl?: string;

    @ApiPropertyOptional({
        description: 'Discord invite URL',
        example: 'https://discord.gg/epicserver',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    discordUrl?: string;

    @ApiPropertyOptional({
        description: 'Server banner image URL',
        example: 'https://cdn.epicserver.com/banner.png',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    bannerUrl?: string;

    @ApiPropertyOptional({
        description: 'Server logo image URL',
        example: 'https://cdn.epicserver.com/logo.png',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    logoUrl?: string;

    @ApiProperty({
        description: 'Server category',
        enum: ServerCategory,
        example: ServerCategory.SURVIVAL,
    })
    @IsEnum(ServerCategory)
    category: ServerCategory;

    @ApiProperty({
        description: 'Server region',
        enum: ServerRegion,
        example: ServerRegion.NA,
    })
    @IsEnum(ServerRegion)
    region: ServerRegion;

    @ApiPropertyOptional({
        description: 'Primary language (ISO 639-1 code)',
        example: 'en',
        default: 'en',
        maxLength: 10,
    })
    @IsString()
    @Length(2, 10)
    @IsOptional()
    language?: string;

    @ApiProperty({
        description: 'Maximum player capacity',
        example: 100,
        minimum: 1,
        maximum: 10000,
    })
    @IsInt()
    @Min(1)
    @Max(10000)
    maxPlayers: number;

    @ApiPropertyOptional({
        description: 'Current number of online players',
        example: 45,
        default: 0,
        minimum: 0,
    })
    @IsInt()
    @Min(0)
    @IsOptional()
    currentPlayers?: number;

    @ApiPropertyOptional({
        description: 'Custom theme configuration for the server',
        nullable: true,
    })
    @IsObject()
    @IsOptional()
    theme?: Theme;
}

/**
 * DTO for updating an existing server listing
 * All fields are optional to allow partial updates
 */
export class UpdateServerDto {
    @ApiPropertyOptional({
        description: 'Server name',
        example: 'Epic Survival Server',
        minLength: 3,
        maxLength: 100,
    })
    @IsString()
    @Length(3, 100)
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Server IP address or hostname',
        example: 'play.epicserver.com',
        maxLength: 255,
    })
    @IsString()
    @Length(1, 255)
    @IsOptional()
    ipAddress?: string;

    @ApiPropertyOptional({
        description: 'Server port',
        example: 3000,
        minimum: 1,
        maximum: 65535,
    })
    @IsInt()
    @Min(1)
    @Max(65535)
    @IsOptional()
    port?: number;

    @ApiPropertyOptional({
        description: 'Server description (supports markdown)',
        example: 'A friendly survival server with custom plugins and active community!',
        minLength: 50,
        maxLength: 5000,
    })
    @IsString()
    @Length(50, 5000)
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Server website URL',
        example: 'https://epicserver.com',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    websiteUrl?: string;

    @ApiPropertyOptional({
        description: 'Discord invite URL',
        example: 'https://discord.gg/epicserver',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    discordUrl?: string;

    @ApiPropertyOptional({
        description: 'Server banner image URL',
        example: 'https://cdn.epicserver.com/banner.png',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    bannerUrl?: string;

    @ApiPropertyOptional({
        description: 'Server logo image URL',
        example: 'https://cdn.epicserver.com/logo.png',
        maxLength: 500,
    })
    @IsUrl()
    @IsOptional()
    logoUrl?: string;

    @ApiPropertyOptional({
        description: 'Server category',
        enum: ServerCategory,
        example: ServerCategory.SURVIVAL,
    })
    @IsEnum(ServerCategory)
    @IsOptional()
    category?: ServerCategory;

    @ApiPropertyOptional({
        description: 'Server region',
        enum: ServerRegion,
        example: ServerRegion.NA,
    })
    @IsEnum(ServerRegion)
    @IsOptional()
    region?: ServerRegion;

    @ApiPropertyOptional({
        description: 'Primary language (ISO 639-1 code)',
        example: 'en',
        maxLength: 10,
    })
    @IsString()
    @Length(2, 10)
    @IsOptional()
    language?: string;

    @ApiPropertyOptional({
        description: 'Maximum player capacity',
        example: 100,
        minimum: 1,
        maximum: 10000,
    })
    @IsInt()
    @Min(1)
    @Max(10000)
    @IsOptional()
    maxPlayers?: number;

    @ApiPropertyOptional({
        description: 'Current number of online players',
        example: 45,
        minimum: 0,
    })
    @IsInt()
    @Min(0)
    @IsOptional()
    currentPlayers?: number;

    @ApiPropertyOptional({
        description: 'Server online status',
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    isOnline?: boolean;

    @ApiPropertyOptional({
        description: 'Server verified status',
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    verified?: boolean;

    @ApiPropertyOptional({
        description: 'Custom theme configuration for the server',
        nullable: true,
    })
    @IsObject()
    @IsOptional()
    theme?: Theme;
}

/**
 * DTO for server responses
 * This is what the API returns to clients
 */
export class ServerResponseDto {
    @ApiProperty({
        description: 'Server unique identifier',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Server owner user ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    ownerId: string;

    @ApiProperty({
        description: 'URL-friendly slug',
        example: 'epic-survival-server',
    })
    slug: string;

    @ApiProperty({
        description: 'Server name',
        example: 'Epic Survival Server',
    })
    name: string;

    @ApiProperty({
        description: 'Server IP address or hostname',
        example: 'play.epicserver.com',
    })
    ipAddress: string;

    @ApiProperty({
        description: 'Server port',
        example: 3000,
    })
    port: number;

    @ApiProperty({
        description: 'Server description',
        example: 'A friendly survival server with custom plugins and active community!',
    })
    description: string;

    @ApiProperty({
        description: 'Server website URL',
        example: 'https://epicserver.com',
        nullable: true,
    })
    websiteUrl?: string;

    @ApiProperty({
        description: 'Discord invite URL',
        example: 'https://discord.gg/epicserver',
        nullable: true,
    })
    discordUrl?: string;

    @ApiProperty({
        description: 'Server banner image URL',
        example: 'https://cdn.epicserver.com/banner.png',
        nullable: true,
    })
    bannerUrl?: string;

    @ApiProperty({
        description: 'Server logo image URL',
        example: 'https://cdn.epicserver.com/logo.png',
        nullable: true,
    })
    logoUrl?: string;

    @ApiProperty({
        description: 'Server category',
        enum: ServerCategory,
        example: ServerCategory.SURVIVAL,
    })
    category: ServerCategory;

    @ApiProperty({
        description: 'Server region',
        enum: ServerRegion,
        example: ServerRegion.NA,
    })
    region: ServerRegion;

    @ApiProperty({
        description: 'Primary language',
        example: 'en',
    })
    language: string;

    @ApiProperty({
        description: 'Maximum player capacity',
        example: 100,
    })
    maxPlayers: number;

    @ApiProperty({
        description: 'Current number of online players',
        example: 45,
    })
    currentPlayers: number;

    @ApiProperty({
        description: 'Server approval status',
        enum: ServerStatus,
        example: ServerStatus.APPROVED,
    })
    status: ServerStatus;

    @ApiProperty({
        description: 'Whether server is currently online',
        example: true,
    })
    isOnline: boolean;

    @ApiProperty({
        description: 'Last ping timestamp',
        example: '2026-01-12T10:30:00Z',
        nullable: true,
    })
    lastPing?: Date;

    @ApiProperty({
        description: 'Whether server is verified',
        example: false,
    })
    verified: boolean;

    @ApiProperty({
        description: 'Whether server is featured',
        example: false,
    })
    featured: boolean;

    @ApiPropertyOptional({
        description: 'Custom theme configuration for the server',
        nullable: true,
    })
    theme?: Theme;

    @ApiProperty({
        description: 'Server creation timestamp',
        example: '2026-01-11T12:00:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Server last update timestamp',
        example: '2026-01-12T08:15:00Z',
    })
    updatedAt: Date;
}
