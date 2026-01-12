import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { CreateServerDto, UpdateServerDto } from './server.dto';
import { Server } from './server.entity';
import { ServerService } from './server.service';

describe('ServerService', () => {
    let service: ServerService;

    const mockRepository = {
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        update: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockCreateServerDto: CreateServerDto = {
        name: 'Epic Survival Server',
        ipAddress: 'play.epicserver.com',
        port: 3000,
        description: 'A friendly survival server with custom plugins and active community!',
        category: 'Survival' as any,
        region: 'NA' as any,
        maxPlayers: 100,
    };

    const mockUpdateServerDto: UpdateServerDto = {
        name: 'Updated Epic Server',
        currentPlayers: 50,
    };

    const mockServer: Server = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ownerId: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'epic-survival-server',
        name: 'Epic Survival Server',
        ipAddress: 'play.epicserver.com',
        port: 3000,
        description: 'A friendly survival server with custom plugins and active community!',
        category: 'Survival',
        region: 'NA',
        language: 'en',
        maxPlayers: 100,
        currentPlayers: 45,
        status: 'approved',
        isOnline: true,
        verified: false,
        featured: false,
        createdAt: new Date('2026-01-11T12:00:00Z'),
        updatedAt: new Date('2026-01-12T08:15:00Z'),
        owner: null as any,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServerService,
                {
                    provide: getRepositoryToken(Server),
                    useValue: mockRepository,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<ServerService>(ServerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return an array of servers', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockRepository.find.mockResolvedValue([mockServer]);

            const result = await service.findAll();

            expect(mockCacheManager.get).toHaveBeenCalled();
            expect(mockRepository.find).toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe(mockServer.name);
        });

        it('should return cached servers if available', async () => {
            const cachedServers = [mockServer];
            mockCacheManager.get.mockResolvedValue(cachedServers);

            const result = await service.findAll();

            expect(mockCacheManager.get).toHaveBeenCalled();
            expect(mockRepository.find).not.toHaveBeenCalled();
            expect(result).toEqual(cachedServers);
        });
    });

    describe('create', () => {
        it('should create and return a server', async () => {
            mockRepository.create.mockReturnValue(mockServer);
            mockRepository.save.mockResolvedValue(mockServer);

            const result = await service.create(mockCreateServerDto, mockServer.ownerId);

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockCacheManager.del).toHaveBeenCalled();
            expect(result.name).toBe(mockServer.name);
            expect(result.slug).toBeDefined();
        });

        it('should generate a slug from the server name', async () => {
            mockRepository.create.mockReturnValue(mockServer);
            mockRepository.save.mockResolvedValue(mockServer);

            await service.create(mockCreateServerDto, mockServer.ownerId);

            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.slug).toBe('epic-survival-server');
        });
    });

    describe('findOne', () => {
        it('should return a server by id', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockRepository.findOneBy.mockResolvedValue(mockServer);

            const result = await service.findOne(mockServer.id);

            expect(mockCacheManager.get).toHaveBeenCalled();
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: mockServer.id });
            expect(mockCacheManager.set).toHaveBeenCalled();
            expect(result.id).toBe(mockServer.id);
        });

        it('should throw NotFoundException if server not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockRepository.findOneBy.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                'Server with ID non-existent-id not found',
            );
        });
    });

    describe('findBySlug', () => {
        it('should return a server by slug', async () => {
            mockRepository.findOneBy.mockResolvedValue(mockServer);

            const result = await service.findBySlug(mockServer.slug);

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ slug: mockServer.slug });
            expect(result.slug).toBe(mockServer.slug);
        });

        it('should throw NotFoundException if server not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);

            await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update and return a server', async () => {
            const updatedServer = { ...mockServer, ...mockUpdateServerDto };

            mockRepository.findOneBy.mockResolvedValue(mockServer);
            mockRepository.save.mockResolvedValue(updatedServer);

            const result = await service.update(
                mockServer.id,
                mockUpdateServerDto,
                mockServer.ownerId,
            );

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: mockServer.id });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
            expect(result.name).toBe(mockUpdateServerDto.name);
        });

        it('should regenerate slug if name is updated', async () => {
            mockRepository.findOneBy.mockResolvedValue(mockServer);
            mockRepository.save.mockResolvedValue({
                ...mockServer,
                ...mockUpdateServerDto,
                slug: 'updated-epic-server',
            });

            await service.update(mockServer.id, mockUpdateServerDto, mockServer.ownerId);

            const saveCall = mockRepository.save.mock.calls[0][0];
            expect(saveCall.slug).toBe('updated-epic-server');
        });

        it('should throw NotFoundException if server not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);

            await expect(
                service.update('non-existent-id', mockUpdateServerDto, mockServer.ownerId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete a server', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await service.delete(mockServer.id, mockServer.ownerId);

            expect(mockRepository.delete).toHaveBeenCalledWith(mockServer.id);
            expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
        });

        it('should throw NotFoundException if server not found', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.delete('non-existent-id', mockServer.ownerId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('approve', () => {
        it('should approve a server', async () => {
            mockRepository.findOneBy.mockResolvedValue(mockServer);
            mockRepository.save.mockResolvedValue({ ...mockServer, status: 'approved' });

            const result = await service.approve(mockServer.id);

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: mockServer.id });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.status).toBe('approved');
        });
    });

    describe('reject', () => {
        it('should reject a server', async () => {
            mockRepository.findOneBy.mockResolvedValue(mockServer);
            mockRepository.save.mockResolvedValue({ ...mockServer, status: 'rejected' });

            const result = await service.reject(mockServer.id);

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: mockServer.id });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.status).toBe('rejected');
        });
    });
});
