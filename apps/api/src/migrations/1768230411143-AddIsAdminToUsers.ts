import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddIsAdminToUsers1768230411143 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isAdmin column to users table
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'isAdmin',
                type: 'boolean',
                default: false,
                isNullable: false,
            }),
        );

        // Create index for faster queries on admin users
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_users_isAdmin',
                columnNames: ['isAdmin'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index first
        await queryRunner.dropIndex('users', 'IDX_users_isAdmin');

        // Drop column
        await queryRunner.dropColumn('users', 'isAdmin');
    }
}
