import {
    Column,
    ColumnType,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Role } from '../rbac/entities/role.entity';
import { Server } from '../server/server.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true, type: 'varchar' })
    password: string | null;

    @Column({ nullable: true, type: 'varchar' })
    name: string | null;

    @Column({ type: 'varchar', unique: true, nullable: true, length: 20 })
    username: string | null;

    @Column({ type: 'varchar', nullable: true, length: 500 })
    avatarUrl: string | null;

    @Column({ type: 'text', nullable: true })
    bio: string | null;

    @Column({ type: 'varchar', nullable: true, length: 100 })
    discordId: string | null;

    @Column({ nullable: true, type: 'varchar' })
    authProvider: string | null;

    @Column({ nullable: true, type: 'varchar' })
    authProviderId: string | null;

    @Column({ nullable: true, type: 'json' })
    authProviderData: Record<string, any> | null;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ type: 'varchar', nullable: true, length: 100 })
    verificationToken: string | null;

    @Column({ default: false })
    isBanned: boolean;

    @Column({ default: false })
    isAdmin: boolean;

    @Column({ type: 'date', nullable: true })
    lastLogin: Date | null;

    @ManyToMany(
        () => Role,
        (role) => role.users,
    )
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'userId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
    })
    roles: Role[];

    @OneToMany(
        () => RefreshToken,
        (refreshToken) => refreshToken.user,
    )
    refreshTokens: RefreshToken[];

    // HyNexus: Organizations removed - will be used for Phase 2 "Communities" feature

    // HyNexus: Server relation
    @OneToMany(
        () => Server,
        (server) => server.owner,
    )
    ownedServers: Server[];

    // HyNexus: Vote relation (to be added when Vote entity is created)
    // @OneToMany(() => Vote, vote => vote.user)
    // votes: Vote[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
