import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddThemeToServers1768250384210 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'servers',
            new TableColumn({
                name: 'theme',
                type: 'jsonb',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('servers', 'theme');
    }
}
