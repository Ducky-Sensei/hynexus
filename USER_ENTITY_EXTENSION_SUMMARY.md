# User Entity Extension Summary

**Date**: 2026-01-11
**Status**: ✅ COMPLETE
**Migration**: `1736635200000-AddHyNexusFieldsToUser.ts`

---

## Changes Made

### 1. User Entity (`apps/api/src/app/user/user.entity.ts`)

Added the following fields for HyNexus platform:

#### Public Profile Fields
```typescript
@Column({ unique: true, nullable: true, length: 20 })
username: string | null;  // Unique username for public display (3-20 chars)

@Column({ nullable: true, length: 500 })
avatarUrl: string | null;  // Profile picture URL

@Column({ type: 'text', nullable: true })
bio: string | null;  // User biography/description
```

#### Integration Fields
```typescript
@Column({ nullable: true, length: 100 })
discordId: string | null;  // Discord account linking
```

#### Security & Verification
```typescript
@Column({ default: false })
emailVerified: boolean;  // Email verification status

@Column({ nullable: true, length: 100 })
verificationToken: string | null;  // Token for email verification

@Column({ default: false })
isBanned: boolean;  // Ban status (separate from isActive)
```

#### Activity Tracking
```typescript
@Column({ nullable: true })
lastLogin: Date | null;  // Last login timestamp
```

#### Future Relations (Commented Out)
```typescript
// @OneToMany(() => Server, server => server.owner)
// ownedServers: Server[];  // Will be added when Server entity is created

// @OneToMany(() => Vote, vote => vote.user)
// votes: Vote[];  // Will be added when Vote entity is created
```

---

### 2. Register DTO (`apps/api/src/app/auth/dto/register.dto.ts`)

Added username validation:

```typescript
@IsString()
@IsNotEmpty({ message: 'Username is required' })
@Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
@Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
})
username: string;
```

**Validation Rules**:
- Required field
- 3-20 characters
- Only letters, numbers, and underscores
- Case-sensitive

---

### 3. Auth Service (`apps/api/src/app/auth/auth.service.ts`)

#### Updated `register()` Method
- Checks for existing username (in addition to email)
- Saves username to database
- Sets `lastLogin` on registration
- Throws `ConflictException` if username is taken

```typescript
// Check if username already exists
const existingUsername = await this.userRepository.findOne({
    where: { username },
});

if (existingUsername) {
    throw new ConflictException('Username is already taken');
}
```

#### Updated `login()` Method
- Checks if user is banned (`isBanned`)
- Updates `lastLogin` timestamp on successful login

```typescript
// Check if user is banned
if (user.isBanned) {
    throw new UnauthorizedException('Account has been banned');
}

// Update last login time
user.lastLogin = new Date();
await this.userRepository.save(user);
```

#### Updated `findOrCreateOAuthUser()` Method
- Auto-generates username for OAuth users
- Sets `lastLogin` on OAuth registration
- Uses new `generateUniqueUsername()` helper

```typescript
// Generate username from email or name for OAuth users
const baseUsername = profile.name?.replace(/\s+/g, '_').toLowerCase() ||
                     profile.email.split('@')[0];
const username = await this.generateUniqueUsername(baseUsername);
```

#### New Helper Method: `generateUniqueUsername()`
Auto-generates unique usernames for OAuth users:

```typescript
private async generateUniqueUsername(baseUsername: string): Promise<string> {
    // Clean username: only letters, numbers, underscores
    let cleanUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '_');

    // Ensure minimum length of 3
    if (cleanUsername.length < 3) {
        cleanUsername = `user_${cleanUsername}`;
    }

    // Truncate to 20 chars max
    cleanUsername = cleanUsername.substring(0, 20);

    // Check if username is available
    let username = cleanUsername;
    let counter = 1;

    while (await this.userRepository.findOne({ where: { username } })) {
        const suffix = `_${counter}`;
        username = cleanUsername.substring(0, 20 - suffix.length) + suffix;
        counter++;
    }

    return username;
}
```

**Examples**:
- `"John Doe"` → `"john_doe"`
- `"john_doe"` (taken) → `"john_doe_1"`
- `"test@email.com"` → `"test"`
- `"a"` → `"user_a"`

---

### 4. Database Migration

**File**: `apps/api/src/migrations/1736635200000-AddHyNexusFieldsToUser.ts`

**Schema Changes**:
- Adds 8 new columns to `users` table
- Creates 3 new indexes for performance
- Adds unique constraint on `username`

**Indexes Created**:
1. `IDX_users_username` - Fast username lookups
2. `IDX_users_emailVerified` - Filter verified users
3. `IDX_users_isBanned` - Filter banned users

**To Apply Migration**:
```bash
# Start database first
pnpm dev:api

# Or manually run migration
pnpm migration:run
```

---

## API Changes

### Registration Endpoint

**Before**:
```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**After**:
```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "username": "johndoe"  # ← NEW: Required field
  }'
```

**Validation Errors**:
```json
// Missing username
{
  "statusCode": 400,
  "message": ["Username is required"],
  "error": "Bad Request"
}

// Username too short
{
  "statusCode": 400,
  "message": ["Username must be between 3 and 20 characters"],
  "error": "Bad Request"
}

// Invalid characters
{
  "statusCode": 400,
  "message": ["Username can only contain letters, numbers, and underscores"],
  "error": "Bad Request"
}

// Username taken
{
  "statusCode": 409,
  "message": "Username is already taken",
  "error": "Conflict"
}
```

---

## OAuth Behavior

### Google/GitHub OAuth
When users sign in with OAuth:

1. **First Time**: Username is auto-generated
   - From name: `"John Doe"` → `"john_doe"`
   - From email: `"test@gmail.com"` → `"test"`
   - If taken: Appends number (`"test_1"`, `"test_2"`, etc.)

2. **Subsequent Logins**: Username is preserved

3. **Account Linking**: If email exists, OAuth is linked to existing account

---

## User Profile Fields Summary

| Field | Type | Required | Unique | Purpose |
|-------|------|----------|--------|---------|
| `username` | varchar(20) | Yes* | Yes | Public display name |
| `avatarUrl` | varchar(500) | No | No | Profile picture URL |
| `bio` | text | No | No | User biography |
| `discordId` | varchar(100) | No | No | Discord integration |
| `emailVerified` | boolean | Yes | No | Email verification status |
| `verificationToken` | varchar(100) | No | No | Verification token |
| `isBanned` | boolean | Yes | No | Ban status |
| `lastLogin` | timestamp | No | No | Last login tracking |

*Required for manual registration, auto-generated for OAuth

---

## Testing Checklist

- [ ] Register new user with username
- [ ] Register fails if username is taken
- [ ] Register fails if username is invalid (special chars)
- [ ] Register fails if username is too short/long
- [ ] OAuth generates unique username automatically
- [ ] Login updates `lastLogin` timestamp
- [ ] Banned user cannot login (`isBanned = true`)
- [ ] Migration applies successfully
- [ ] Existing users are not affected (username = null)

---

## Next Steps

1. ✅ User entity extended
2. ⬜ Create Server entity and module
3. ⬜ Create Vote entity and module
4. ⬜ Add user profile endpoints (GET/PUT /users/:id)
5. ⬜ Add email verification system
6. ⬜ Add admin ban/unban endpoints

---

## Breaking Changes

⚠️ **API Breaking Change**: The `/auth/register` endpoint now **requires** a `username` field.

**Migration Path for Existing Frontend**:
```typescript
// OLD
const registerDto = {
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
};

// NEW
const registerDto = {
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  username: 'johndoe'  // ← Add this
};
```

---

## Files Modified

1. `apps/api/src/app/user/user.entity.ts` - Added 8 new fields
2. `apps/api/src/app/auth/dto/register.dto.ts` - Added username validation
3. `apps/api/src/app/auth/auth.service.ts` - Updated auth logic
4. `apps/api/src/migrations/1736635200000-AddHyNexusFieldsToUser.ts` - New migration

---

**Status**: ✅ Ready to run migration and test!

Run `pnpm dev:api` to start the backend and automatically apply migrations.
