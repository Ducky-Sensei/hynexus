import { INestApplication, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Permission } from '../../src/app/rbac/entities/permission.entity';
import { Role } from '../../src/app/rbac/entities/role.entity';
import { Server } from '../../src/app/server/server.entity';
import { User } from '../../src/app/user/user.entity';

export async function seedDatabase(app: INestApplication): Promise<void> {
    Logger.log('Seeding database...');

    const dataSource = app.get(DataSource);

    await clearAllTables(dataSource);

    const permissions = await seedPermissions(dataSource);
    const roles = await seedRoles(dataSource, permissions);
    const users = await seedUsers(dataSource, roles);
    await seedServers(dataSource, users);

    Logger.log('Database seeding completed');
}

async function clearAllTables(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;
    const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ');

    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
    Logger.log(`Cleared all tables with CASCADE`);
}

async function seedPermissions(dataSource: DataSource): Promise<Permission[]> {
    const permissionRepository = dataSource.getRepository(Permission);

    const permissions = [
        { resource: 'servers', action: 'read', description: 'Read servers' },
        { resource: 'servers', action: 'create', description: 'Create servers' },
        { resource: 'servers', action: 'update', description: 'Update servers' },
        { resource: 'servers', action: 'delete', description: 'Delete servers' },
        { resource: 'servers', action: 'approve', description: 'Approve/reject servers' },
        { resource: 'users', action: 'read', description: 'Read users' },
        { resource: 'users', action: 'create', description: 'Create users' },
        { resource: 'users', action: 'update', description: 'Update users' },
        { resource: 'users', action: 'delete', description: 'Delete users' },
    ];

    const saved = await permissionRepository.save(permissions);
    Logger.log(`Seeded ${saved.length} permissions`);
    return saved;
}

async function seedRoles(dataSource: DataSource, permissions: Permission[]): Promise<Role[]> {
    const roleRepository = dataSource.getRepository(Role);

    const adminRole = roleRepository.create({
        name: 'admin',
        description: 'Administrator with full access',
        permissions: permissions,
    });

    const userRole = roleRepository.create({
        name: 'user',
        description: 'Regular user with read access',
        permissions: permissions.filter((p) => p.action === 'read'),
    });

    const moderatorRole = roleRepository.create({
        name: 'moderator',
        description: 'Moderator with read and update access',
        permissions: permissions.filter((p) => ['read', 'update'].includes(p.action)),
    });

    const saved = await roleRepository.save([adminRole, userRole, moderatorRole]);
    Logger.log(`Seeded ${saved.length} roles (admin, user, moderator)`);
    return saved;
}

async function seedUsers(dataSource: DataSource, roles: Role[]): Promise<User[]> {
    const userRepository = dataSource.getRepository(User);

    const hashedPassword = await bcrypt.hash('Foobar1!', 10);

    const adminRole = roles.find((r) => r.name === 'admin')!;
    const userRole = roles.find((r) => r.name === 'user')!;

    const users = [
        {
            email: 'admin@admin.com',
            password: hashedPassword,
            name: 'Platform Admin',
            username: 'admin',
            isActive: true,
            isAdmin: true, // Platform administrator - can moderate entire site
            authProvider: 'password',
            emailVerified: true,
            roles: [adminRole],
        },
        {
            email: 'user@user.com',
            password: hashedPassword,
            name: 'Regular User',
            username: 'regularuser',
            isActive: true,
            isAdmin: false, // Regular user - can only manage their own servers
            authProvider: 'password',
            emailVerified: true,
            roles: [userRole],
        },
    ];

    const savedUsers = await userRepository.save(users);
    Logger.log(
        `Seeded ${savedUsers.length} users (admin@admin.com / user@user.com - password: Foobar1!)`,
    );
    return savedUsers;
}

async function seedServers(dataSource: DataSource, users: User[]): Promise<void> {
    const serverRepository = dataSource.getRepository(Server);

    const adminUser = users.find((u) => u.email === 'admin@admin.com')!;

    const servers = [
        {
            name: 'Epic Survival Server',
            slug: 'epic-survival-server',
            ipAddress: 'play.epicserver.com',
            port: 3000,
            description:
                'Welcome to Epic Survival Server! Join our friendly community and embark on an adventure in a custom-crafted world. We feature custom plugins, weekly events, and an active staff team. Perfect for both new and experienced players!',
            websiteUrl: 'https://epicserver.com',
            discordUrl: 'https://discord.gg/epicserver',
            category: 'Survival',
            region: 'NA',
            language: 'en',
            maxPlayers: 100,
            currentPlayers: 45,
            status: 'approved',
            isOnline: true,
            verified: true,
            featured: false,
            ownerId: adminUser.id,
        },
    ];

    await serverRepository.save(servers);
    Logger.log(`Seeded ${servers.length} server (Epic Survival Server - Owner: admin@admin.com)`);
}
