import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import type { Repository } from 'typeorm';
import type { CreateServerDto, ServerResponseDto, UpdateServerDto } from './server.dto';
import { Server } from './server.entity';
import { ServerMapper } from './server.mapper';

@Injectable()
export class ServerService {
    private readonly CACHE_KEY_ALL = 'servers:all';
    private readonly CACHE_KEY_PREFIX = 'server:';

    constructor(
        @InjectRepository(Server)
        private readonly serverRepository: Repository<Server>,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {}

    /**
     * Generates a URL-friendly slug from the server name
     * @param name The server name
     * @returns A URL-friendly slug
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Gets a list of all servers.
     * Cached to reduce database load for frequently accessed data.
     * @returns A list of server DTOs.
     */
    async findAll(): Promise<ServerResponseDto[]> {
        const cached = await this.cacheManager.get<ServerResponseDto[]>(this.CACHE_KEY_ALL);
        if (cached) {
            return cached;
        }

        const servers = await this.serverRepository.find({
            order: { createdAt: 'DESC' },
        });
        const serverDtos = ServerMapper.toDtoArray(servers);

        await this.cacheManager.set(this.CACHE_KEY_ALL, serverDtos);

        return serverDtos;
    }

    /**
     * Creates a new server listing.
     * Invalidates the servers list cache since the data has changed.
     * @param createServerDto The server data to create.
     * @param ownerId The ID of the user creating the server.
     * @returns The created server DTO.
     */
    async create(createServerDto: CreateServerDto, ownerId: string): Promise<ServerResponseDto> {
        const slug = this.generateSlug(createServerDto.name);

        const server = this.serverRepository.create({
            ...createServerDto,
            slug,
            ownerId,
            port: createServerDto.port ?? 3000,
            language: createServerDto.language ?? 'en',
            currentPlayers: createServerDto.currentPlayers ?? 0,
            status: 'pending',
        });

        const savedServer = await this.serverRepository.save(server);

        await this.cacheManager.del(this.CACHE_KEY_ALL);

        return ServerMapper.toDto(savedServer);
    }

    /**
     * Gets a single server by ID.
     * Cached to reduce database load for frequently accessed servers.
     * @param id The ID of the server.
     * @returns The server DTO.
     * @throws NotFoundException if the server doesn't exist.
     */
    async findOne(id: string): Promise<ServerResponseDto> {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

        const cached = await this.cacheManager.get<ServerResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const server = await this.serverRepository.findOneBy({ id });

        if (!server) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }

        const serverDto = ServerMapper.toDto(server);

        await this.cacheManager.set(cacheKey, serverDto);

        return serverDto;
    }

    /**
     * Gets a single server by slug.
     * @param slug The slug of the server.
     * @returns The server DTO.
     * @throws NotFoundException if the server doesn't exist.
     */
    async findBySlug(slug: string): Promise<ServerResponseDto> {
        const server = await this.serverRepository.findOneBy({ slug });

        if (!server) {
            throw new NotFoundException(`Server with slug ${slug} not found`);
        }

        return ServerMapper.toDto(server);
    }

    /**
     * Updates an existing server.
     * Invalidates both the specific server cache and the servers list cache.
     * @param id The ID of the server to update.
     * @param updateServerDto The fields to update.
     * @param userId The ID of the user attempting the update.
     * @returns The updated server DTO.
     * @throws NotFoundException if the server doesn't exist.
     */
    async update(
        id: string,
        updateServerDto: UpdateServerDto,
        userId: string,
    ): Promise<ServerResponseDto> {
        const server = await this.serverRepository.findOneBy({ id });

        if (!server) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }

        // TODO: Add authorization check to ensure user is owner or admin
        // For now, we'll just update

        // If name is being updated, regenerate slug
        if (updateServerDto.name && updateServerDto.name !== server.name) {
            Object.assign(server, {
                ...updateServerDto,
                slug: this.generateSlug(updateServerDto.name),
            });
        } else {
            Object.assign(server, updateServerDto);
        }

        const updatedServer = await this.serverRepository.save(server);

        await Promise.all([
            this.cacheManager.del(this.CACHE_KEY_ALL), // List cache
            this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`), // Specific server cache
        ]);

        return ServerMapper.toDto(updatedServer);
    }

    /**
     * Deletes a server by ID.
     * Invalidates both the specific server cache and the servers list cache.
     * @param id The ID of the server to delete.
     * @param userId The ID of the user attempting the deletion.
     * @throws NotFoundException if the server doesn't exist.
     */
    async delete(id: string, userId: string): Promise<void> {
        // TODO: Add authorization check to ensure user is owner or admin
        const result = await this.serverRepository.delete(id);

        if (!result.affected) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }

        await Promise.all([
            this.cacheManager.del(this.CACHE_KEY_ALL),
            this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`),
        ]);
    }

    /**
     * Approves a server (admin only).
     * @param id The ID of the server to approve.
     * @returns The updated server DTO.
     */
    async approve(id: string): Promise<ServerResponseDto> {
        const server = await this.serverRepository.findOneBy({ id });

        if (!server) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }

        server.status = 'approved';
        const updatedServer = await this.serverRepository.save(server);

        await Promise.all([
            this.cacheManager.del(this.CACHE_KEY_ALL),
            this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`),
        ]);

        return ServerMapper.toDto(updatedServer);
    }

    /**
     * Rejects a server (admin only).
     * @param id The ID of the server to reject.
     * @returns The updated server DTO.
     */
    async reject(id: string): Promise<ServerResponseDto> {
        const server = await this.serverRepository.findOneBy({ id });

        if (!server) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }

        server.status = 'rejected';
        const updatedServer = await this.serverRepository.save(server);

        await Promise.all([
            this.cacheManager.del(this.CACHE_KEY_ALL),
            this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`),
        ]);

        return ServerMapper.toDto(updatedServer);
    }
}
