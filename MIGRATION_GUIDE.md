# Migration Guide for HyNexus

## Understanding Migration Timestamps

Migration filenames follow this pattern:
```
<timestamp>-<DescriptiveName>.ts
```

**Example**: `1736637000000-AddHyNexusFieldsToUser.ts`

### How Timestamps Work

1. **Format**: Unix timestamp in milliseconds (Date.now())
2. **Purpose**: Determines execution order and tracks which migrations have run
3. **Generated Automatically**: When using TypeORM CLI

### Current Migrations

```
1734000000000-Init.ts                      (Dec 2024 - Initial schema)
1734100000000-AddOAuthAndRefreshTokens.ts  (Dec 2024 - OAuth support)
1735200000000-AddOrganizations.ts          (Dec 2024 - Organizations)
1736637000000-AddHyNexusFieldsToUser.ts    (Jan 2026 - HyNexus user fields)
```

---

## How to Create Migrations

### Method 1: Auto-Generate (RECOMMENDED)

**When to use**: When you've modified entity files and want TypeORM to detect changes

```bash
# 1. Make sure database is running
pnpm dev:api

# 2. In another terminal, generate migration
pnpm migration:generate AddServerEntity

# This creates:
# src/migrations/<timestamp>-AddServerEntity.ts
```

**How it works**:
- TypeORM compares your entity files with the current database schema
- Automatically detects differences (new columns, tables, indexes, etc.)
- Generates migration with proper timestamp
- Creates both `up()` and `down()` methods

**Advantages**:
- ✅ Timestamp is automatically generated (Date.now())
- ✅ Detects schema differences automatically
- ✅ Less error-prone
- ✅ Handles complex changes

---

### Method 2: Manual Creation (Use Sparingly)

**When to use**: For data migrations, custom SQL, or when DB isn't running

```bash
# 1. Generate timestamp
node -e "console.log(Date.now())"
# Output: 1768169540000

# 2. Create file manually
touch apps/api/src/migrations/1768169540000-CustomMigration.ts
```

**Template**:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomMigration1768169540000 implements MigrationInterface {
    name = 'CustomMigration1768169540000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Your migration SQL here
        await queryRunner.query(`
            -- SQL statements
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback SQL here
        await queryRunner.query(`
            -- Reverse SQL statements
        `);
    }
}
```

**IMPORTANT**:
- Class name MUST match: `<Name><Timestamp>`
- `name` property MUST match class name
- Timestamp MUST be unique and sequential

---

## Running Migrations

### Development

Migrations run automatically when you start the API:
```bash
pnpm dev:api
# Migrations are auto-run on startup
```

Or run manually:
```bash
pnpm migration:run
```

### View Migration Status

```bash
pnpm migration:show

# Output:
# [X] Init1734000000000
# [X] AddOAuthAndRefreshTokens1734100000000
# [X] AddOrganizations1735200000000
# [ ] AddHyNexusFieldsToUser1736637000000  <- Pending
```

### Revert Last Migration

```bash
pnpm migration:revert

# This runs the down() method of the last executed migration
```

---

## Migration Naming Conventions

### Good Names ✅

```
AddHyNexusFieldsToUser    - Clear, describes what's added
CreateServerEntity         - Creates new table
AddVotingSystem           - Multiple related changes
UpdateUserIndexes         - Performance improvements
FixServerTimestamps       - Bug fix
```

### Bad Names ❌

```
Update                    - Too vague
Migration1               - No description
Temp                     - Unclear purpose
Fix                      - What does it fix?
New                      - What's new?
```

---

## Common Migration Patterns

### 1. Add New Column

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "users"
        ADD "username" varchar(20) NULL
    `);

    // Add unique constraint
    await queryRunner.query(`
        ALTER TABLE "users"
        ADD CONSTRAINT "UQ_users_username" UNIQUE ("username")
    `);

    // Add index
    await queryRunner.query(`
        CREATE INDEX "IDX_users_username" ON "users" ("username")
    `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_username"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
}
```

### 2. Create New Table

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "servers" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" varchar(100) NOT NULL,
            "ipAddress" varchar(255) NOT NULL,
            "port" integer DEFAULT 3000,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW()
        )
    `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "servers"`);
}
```

### 3. Add Foreign Key Relationship

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column
    await queryRunner.query(`
        ALTER TABLE "servers"
        ADD "ownerId" uuid
    `);

    // Add foreign key
    await queryRunner.query(`
        ALTER TABLE "servers"
        ADD CONSTRAINT "FK_servers_owner"
        FOREIGN KEY ("ownerId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
    `);

    // Add index
    await queryRunner.query(`
        CREATE INDEX "IDX_servers_ownerId" ON "servers" ("ownerId")
    `);
}
```

### 4. Data Migration

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing data
    await queryRunner.query(`
        UPDATE "users"
        SET "emailVerified" = true
        WHERE "authProvider" = 'google'
        OR "authProvider" = 'github'
    `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE "users"
        SET "emailVerified" = false
    `);
}
```

---

## Troubleshooting

### ❌ Error: "QueryFailedError: relation does not exist"

**Problem**: Migration references a table that doesn't exist yet

**Solution**: Check migration order. Ensure tables are created before being referenced.

---

### ❌ Error: "Migration has already been run"

**Problem**: Trying to run a migration that's already in the database

**Solution**:
```bash
# Check migration status
pnpm migration:show

# If you need to re-run, revert first
pnpm migration:revert
```

---

### ❌ Error: "Class name doesn't match filename"

**Problem**:
```typescript
// File: 1768169540000-AddServerEntity.ts
export class WrongName implements MigrationInterface {  // ❌ Wrong!
```

**Solution**:
```typescript
// File: 1768169540000-AddServerEntity.ts
export class AddServerEntity1768169540000 implements MigrationInterface {  // ✅ Correct!
    name = 'AddServerEntity1768169540000';
```

---

### ❌ Error: "Cannot connect to database"

**Problem**: Database isn't running

**Solution**:
```bash
# Start the dev server (auto-starts DB via testcontainers)
pnpm dev:api

# Or start DB manually with Docker
docker compose -f apps/api/docker-compose.dev.yml up -d
```

---

## Best Practices

### ✅ DO

1. **Use descriptive names**: `AddVotingSystem` not `Update`
2. **One logical change per migration**: Don't mix unrelated changes
3. **Always write `down()` method**: For rollback capability
4. **Test rollback**: Run `migration:revert` to ensure it works
5. **Add indexes for foreign keys**: Improves query performance
6. **Use transactions** (QueryRunner handles this automatically)

### ❌ DON'T

1. **Don't modify existing migrations**: Once run in production
2. **Don't use `synchronize: true`**: In production (data loss risk)
3. **Don't skip migrations**: Run them in order
4. **Don't hardcode values**: Use proper SQL with parameters
5. **Don't forget constraints**: Unique, NOT NULL, foreign keys

---

## Quick Reference Commands

```bash
# Generate migration (auto-detects entity changes)
pnpm migration:generate MigrationName

# Create empty migration manually
pnpm migration:create MigrationName

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Get current timestamp for manual migrations
node -e "console.log(Date.now())"
```

---

## Production Deployment

### Safe Deployment Process

1. **Test migrations locally**:
   ```bash
   pnpm migration:run
   pnpm dev:api  # Verify everything works
   pnpm migration:revert  # Test rollback
   pnpm migration:run  # Re-apply
   ```

2. **Backup production database**:
   ```bash
   pg_dump -h localhost -U user dbname > backup.sql
   ```

3. **Run migrations in production**:
   ```bash
   # Set production env vars
   export DATABASE_URL="postgresql://..."

   # Run migrations
   pnpm migration:run
   ```

4. **Verify**:
   ```bash
   pnpm migration:show
   # All migrations should show [X]
   ```

5. **If something goes wrong**:
   ```bash
   # Restore from backup
   psql -h localhost -U user dbname < backup.sql
   ```

---

## Example Workflow: Adding Server Entity

```bash
# 1. Create the entity file
# apps/api/src/app/server/server.entity.ts
# (Define @Entity, @Column, etc.)

# 2. Start dev server
pnpm dev:api

# 3. In another terminal, generate migration
pnpm migration:generate CreateServerEntity

# 4. Review generated migration
cat apps/api/src/migrations/*-CreateServerEntity.ts

# 5. Test migration
pnpm migration:show  # Verify pending
# Restart dev:api (auto-runs migration)

# 6. Verify in database
psql -d hynexus_dev -c "\dt"  # Should show 'servers' table
```

---

## Timestamp Calculation Reference

```javascript
// Current timestamp
Date.now()  // 1768169540000

// Convert timestamp to date
new Date(1768169540000).toISOString()
// "2026-01-11T..."

// Calculate timestamp for specific date
new Date('2026-01-11').getTime()
// 1768147200000
```

---

**Remember**: Always use `pnpm migration:generate` when possible. It's safer, more accurate, and automatically generates proper timestamps!
