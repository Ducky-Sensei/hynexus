import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddFieldsToUser1768172875504 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'username',
                type: 'varchar',
                isNullable: true,
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'UQ_users_username',
                columnNames: ['username'],
                isUnique: true,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'avatarUrl',
                type: 'varchar',
                length: '500',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'bio',
                type: 'text',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'discordId',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'emailVerified',
                type: 'boolean',
                default: false,
                isNullable: false,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'verificationToken',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'isBanned',
                type: 'boolean',
                default: false,
                isNullable: false,
            }),
        );

        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'lastLogin',
                type: 'timestamp',
                isNullable: true,
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_users_username',
                columnNames: ['username'],
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_users_emailVerified',
                columnNames: ['emailVerified'],
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_users_isBanned',
                columnNames: ['isBanned'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex('users', 'IDX_users_isBanned');
        await queryRunner.dropIndex('users', 'IDX_users_emailVerified');
        await queryRunner.dropIndex('users', 'IDX_users_username');
        await queryRunner.dropIndex('users', 'UQ_users_username');

        // Then drop columns in reverse order (good practice)
        await queryRunner.dropColumn('users', 'lastLogin');
        await queryRunner.dropColumn('users', 'isBanned');
        await queryRunner.dropColumn('users', 'verificationToken');
        await queryRunner.dropColumn('users', 'emailVerified');
        await queryRunner.dropColumn('users', 'discordId');
        await queryRunner.dropColumn('users', 'bio');
        await queryRunner.dropColumn('users', 'avatarUrl');
        await queryRunner.dropColumn('users', 'username');
    }
}
