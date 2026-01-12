import type { Theme } from '@hynexus/types';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('servers')
export class Server {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(
        () => User,
        (user) => user.ownedServers,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column({ type: 'uuid' })
    ownerId: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    ipAddress: string;

    @Column({ type: 'integer', default: 3000 })
    port: number;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    websiteUrl?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    discordUrl?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    bannerUrl?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl?: string;

    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ type: 'varchar', length: 10 })
    region: string;

    @Column({ type: 'varchar', length: 10, default: 'en' })
    language: string;

    @Column({ type: 'integer' })
    maxPlayers: number;

    @Column({ type: 'integer', default: 0 })
    currentPlayers: number;

    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status: string; // pending, approved, rejected, suspended

    @Column({ type: 'boolean', default: false })
    isOnline: boolean;

    @Column({ type: 'timestamp', nullable: true })
    lastPing?: Date;

    @Column({ type: 'boolean', default: false })
    verified: boolean;

    @Column({ type: 'boolean', default: false })
    featured: boolean;

    @Column({ type: 'jsonb', nullable: true })
    theme?: Theme;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
