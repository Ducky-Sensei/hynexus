import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class ReplaceProductWithServerModule1768227059141 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('product');

        await queryRunner.createTable(
            new Table({
                name: 'servers',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'ownerId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'slug',
                        type: 'varchar',
                        length: '100',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'ipAddress',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'port',
                        type: 'integer',
                        default: 3000,
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'websiteUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'discordUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'bannerUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'logoUrl',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'category',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'region',
                        type: 'varchar',
                        length: '10',
                        isNullable: false,
                    },
                    {
                        name: 'language',
                        type: 'varchar',
                        length: '10',
                        default: "'en'",
                        isNullable: false,
                    },
                    {
                        name: 'maxPlayers',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'currentPlayers',
                        type: 'integer',
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '20',
                        default: "'pending'",
                        isNullable: false,
                    },
                    {
                        name: 'isOnline',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'lastPing',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'verified',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'featured',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'servers',
            new TableForeignKey({
                columnNames: ['ownerId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_slug',
                columnNames: ['slug'],
                isUnique: true,
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_ownerId',
                columnNames: ['ownerId'],
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_category',
                columnNames: ['category'],
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_region',
                columnNames: ['region'],
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_status',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_isOnline',
                columnNames: ['isOnline'],
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_featured',
                columnNames: ['featured'],
            }),
        );

        await queryRunner.createIndex(
            'servers',
            new TableIndex({
                name: 'IDX_servers_createdAt',
                columnNames: ['createdAt'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('servers');

        await queryRunner.createTable(
            new Table({
                name: 'product',
                columns: [
                    {
                        name: 'id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'quantity',
                        type: 'double precision',
                        isNullable: false,
                    },
                    {
                        name: 'unit',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'price',
                        type: 'double precision',
                        isNullable: false,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                ],
            }),
            true,
        );
    }
}
