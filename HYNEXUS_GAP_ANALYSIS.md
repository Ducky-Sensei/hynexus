# HyNexus Gap Analysis & Implementation Plan

**Generated**: 2026-01-11
**Purpose**: Identify what exists vs. what's needed for HyNexus Hytale server listing platform

---

## Current Codebase Structure

### ✅ What You Already Have

#### 1. **User Management** (`src/app/user/`)
**Entity**: `user.entity.ts`
```typescript
- id (UUID)
- email (unique)
- password (nullable for OAuth)
- name (nullable)
- authProvider, authProviderId, authProviderData (OAuth support)
- isActive (boolean)
- roles (ManyToMany with Role)
- refreshTokens (OneToMany with RefreshToken)
- organizations (ManyToMany with Organization)
- createdAt, updatedAt
```

**Status**: ✅ **COMPLETE** - Needs minor extensions for HyNexus

**What's Missing for HyNexus**:
- `username` (unique, 3-20 chars, for public display)
- `avatarUrl` (for profile pictures)
- `bio` (text, for user profile)
- `discordId` (for Discord integration)
- `emailVerified` (boolean)
- `verificationToken` (for email verification)
- `isBanned` (separate from isActive)
- `lastLogin` (timestamp)

---

#### 2. **Authentication** (`src/app/auth/`)
**Files**:
- `auth.controller.ts` - Has register, login, OAuth (Google/GitHub), refresh, logout
- `auth.service.ts` - Authentication logic
- `auth.module.ts` - Module configuration
- Guards: JWT, Google OAuth, GitHub OAuth
- DTOs: Register, Login, RefreshToken, AuthResponse
- Decorators: CurrentUser, Public
- Entity: RefreshToken

**Status**: ✅ **COMPLETE** - Perfect for HyNexus

**Existing Endpoints**:
```typescript
POST /auth/register
POST /auth/login
GET  /auth/me
GET  /auth/google
GET  /auth/google/callback
GET  /auth/github
GET  /auth/github/callback
POST /auth/refresh
POST /auth/logout
```

**What Works**:
- ✅ JWT token authentication
- ✅ Email/password registration
- ✅ OAuth (Google, GitHub)
- ✅ Token refresh mechanism
- ✅ Throttling on login (5 requests per minute)

---

#### 3. **RBAC (Role-Based Access Control)** (`src/app/rbac/`)
**Entities**:
- `role.entity.ts` - Roles with permissions
- `permission.entity.ts` - Granular permissions

**Status**: ✅ **USEFUL** - Can be used for admin/moderator roles

**How to Use for HyNexus**:
- Create roles: `admin`, `moderator`, `server_owner`, `user`
- Create permissions: `approve_servers`, `ban_users`, `manage_servers`, etc.

---

#### 4. **Product Module** (`src/app/product/`)
**Status**: ❌ **NOT NEEDED** - Replace with Server module

This is a demo/scaffold module. We'll create a similar structure for:
- Server management
- Vote management
- Staff listings
- Reviews

---

#### 5. **Organization Module** (`src/app/organization/`)
**Status**: 🤔 **PARTIALLY USEFUL** - Could be repurposed for Communities

The organization entity could be adapted for:
- Cross-server communities (Phase 2)
- Server networks
- Multi-server groups

---

#### 6. **Infrastructure**
**Status**: ✅ **EXCELLENT**

Already configured:
- ✅ PostgreSQL with TypeORM
- ✅ Redis caching
- ✅ Prometheus metrics
- ✅ Pino logging
- ✅ Throttling/rate limiting
- ✅ Health checks
- ✅ Migrations system
- ✅ Testcontainers for dev

---

## What You Need to Create for HyNexus

### 🆕 New Modules Required

#### 1. **Server Module** (`src/app/server/`)
**Priority**: 🔴 CRITICAL

**Entity**: `server.entity.ts`
```typescript
@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.ownedServers)
  owner: User;

  @Column({ unique: true, length: 100 })
  slug: string; // URL-friendly name

  @Column({ length: 100 })
  name: string;

  @Column()
  ipAddress: string;

  @Column({ default: 3000 })
  port: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true, length: 500 })
  websiteUrl?: string;

  @Column({ nullable: true, length: 500 })
  discordUrl?: string;

  @Column({ nullable: true, length: 500 })
  bannerUrl?: string;

  @Column({ nullable: true, length: 500 })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // Survival, PvP, Creative, Minigames, RPG, Roleplay, Anarchy

  @Column({ type: 'varchar', length: 10 })
  region: string; // NA, EU, Asia, Oceania, SA

  @Column({ default: 'en', length: 10 })
  language: string;

  @Column({ type: 'integer' })
  maxPlayers: number;

  @Column({ default: 0 })
  currentPlayers: number; // Manual entry initially, auto-update when Hytale API available

  @Column({ default: 'pending' }) // pending, approved, rejected, suspended
  status: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastPing?: Date;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: false })
  featured: boolean;

  @OneToMany(() => Vote, vote => vote.server)
  votes: Vote[];

  @OneToMany(() => ServerStaff, staff => staff.server)
  staff: ServerStaff[];

  @OneToMany(() => Review, review => review.server)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Files to Create**:
```
src/app/server/
├── server.entity.ts
├── server.module.ts
├── server.controller.ts
├── server.service.ts
├── dto/
│   ├── create-server.dto.ts
│   ├── update-server.dto.ts
│   ├── list-servers.dto.ts
│   └── server-response.dto.ts
└── guards/
    └── server-owner.guard.ts
```

**Endpoints to Implement**:
```typescript
POST   /servers              - Create server (auth required)
GET    /servers              - List servers with filters/search
GET    /servers/:id          - Get server details
PUT    /servers/:id          - Update server (owner/admin only)
DELETE /servers/:id          - Delete server (owner/admin only)
PATCH  /servers/:id/approve  - Approve server (admin only)
PATCH  /servers/:id/reject   - Reject server (admin only)
GET    /servers/:id/stats    - Get server statistics
```

---

#### 2. **Vote Module** (`src/app/vote/`)
**Priority**: 🔴 CRITICAL

**Entity**: `vote.entity.ts`
```typescript
@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.votes, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Server, server => server.votes, { onDelete: 'CASCADE' })
  server: Server;

  @CreateDateColumn()
  votedAt: Date;

  @Column({ unique: true, length: 8 })
  rewardCode: string; // e.g., "ABCD1234"

  @Column({ default: false })
  claimed: boolean;

  @Column({ nullable: true })
  claimedAt?: Date;

  @Column({ nullable: true, length: 45 })
  ipAddress?: string; // For fraud detection

  @Column({ nullable: true, type: 'text' })
  userAgent?: string;
}

// Add unique constraint for one vote per user per server per day
@Index(['user', 'server', 'votedAt'], { unique: true })
```

**Files to Create**:
```
src/app/vote/
├── vote.entity.ts
├── vote.module.ts
├── vote.controller.ts
├── vote.service.ts
└── dto/
    ├── vote.dto.ts
    └── verify-code.dto.ts
```

**Endpoints to Implement**:
```typescript
POST /servers/:id/vote        - Vote for server (auth required, 24h cooldown)
GET  /servers/:id/can-vote    - Check if user can vote
GET  /votes/verify/:code      - Verify reward code
GET  /servers/:id/votes       - Get vote history for server
GET  /users/:id/votes         - Get user's voting history
```

**Business Logic**:
```typescript
// vote.service.ts
async voteForServer(userId: string, serverId: string, ipAddress: string, userAgent: string) {
  // 1. Check if user voted in last 24 hours
  const lastVote = await this.voteRepository.findOne({
    where: {
      user: { id: userId },
      server: { id: serverId },
      votedAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000))
    }
  });

  if (lastVote) {
    throw new BadRequestException('You can only vote once every 24 hours');
  }

  // 2. Generate unique reward code
  const rewardCode = this.generateRewardCode();

  // 3. Create vote
  const vote = this.voteRepository.create({
    user: { id: userId },
    server: { id: serverId },
    rewardCode,
    ipAddress,
    userAgent,
  });

  await this.voteRepository.save(vote);

  return {
    message: 'Vote recorded successfully',
    rewardCode,
  };
}

private generateRewardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

---

#### 3. **Server Staff Module** (`src/app/server-staff/`)
**Priority**: 🟡 MEDIUM (Phase 1.5)

**Entity**: `server-staff.entity.ts`
```typescript
@Entity('server_staff')
export class ServerStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Server, server => server.staff, { onDelete: 'CASCADE' })
  server: Server;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @Column({ type: 'varchar', length: 50 })
  role: string; // owner, admin, moderator, builder, developer

  @Column({ default: 'active' }) // active, inactive, open (position available)
  status: string;

  @Column({ nullable: true, length: 100 })
  title?: string; // e.g., "Head Moderator"

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true, type: 'text' })
  requirements?: string;

  @CreateDateColumn()
  addedAt: Date;
}
```

**Files to Create**:
```
src/app/server-staff/
├── server-staff.entity.ts
├── server-staff.module.ts
├── server-staff.controller.ts
├── server-staff.service.ts
└── dto/
    ├── create-staff.dto.ts
    └── update-staff.dto.ts
```

**Endpoints**:
```typescript
GET    /servers/:id/staff           - Get server staff list
POST   /servers/:id/staff           - Add staff member (owner only)
PUT    /servers/:id/staff/:staffId  - Update staff (owner only)
DELETE /servers/:id/staff/:staffId  - Remove staff (owner only)
GET    /staff/openings              - List all open positions
```

---

#### 4. **Review Module** (`src/app/review/`)
**Priority**: 🟡 MEDIUM (Phase 2)

**What Reviews Are**: User-submitted ratings and comments for servers (like Yelp/Google reviews)

**Entity**: `review.entity.ts`
```typescript
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Server, server => server.reviews, { onDelete: 'CASCADE' })
  server: Server;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'integer' })
  rating: number; // 1-5 stars

  @Column({ type: 'text' })
  comment: string;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// One review per user per server
@Index(['user', 'server'], { unique: true })
```

**Files to Create**:
```
src/app/review/
├── review.entity.ts
├── review.module.ts
├── review.controller.ts
├── review.service.ts
└── dto/
    ├── create-review.dto.ts
    └── update-review.dto.ts
```

**Endpoints**:
```typescript
GET    /servers/:id/reviews     - Get server reviews
POST   /servers/:id/reviews     - Create review (auth required)
PUT    /reviews/:id             - Update own review
DELETE /reviews/:id             - Delete own review (or admin)
POST   /reviews/:id/upvote      - Upvote review
POST   /reviews/:id/downvote    - Downvote review
```

---

## Implementation Priority & Order

### 🔴 **Phase 0: Prepare User Entity** (30 minutes)

**Modify**: `src/app/user/user.entity.ts`

Add missing fields:
```typescript
@Column({ unique: true, length: 20 })
username: string;

@Column({ nullable: true, length: 500 })
avatarUrl?: string;

@Column({ type: 'text', nullable: true })
bio?: string;

@Column({ nullable: true, length: 100 })
discordId?: string;

@Column({ default: false })
emailVerified: boolean;

@Column({ nullable: true, length: 100 })
verificationToken?: string;

@Column({ default: false })
isBanned: boolean;

@Column({ nullable: true })
lastLogin?: Date;

// Add relation
@OneToMany(() => Server, server => server.owner)
ownedServers: Server[];

@OneToMany(() => Vote, vote => vote.user)
votes: Vote[];
```

**Create Migration**:
```bash
pnpm migration:generate AddHyNexusFieldsToUser
pnpm migration:run
```

---

### 🔴 **Phase 1: Core Server Listing** (Day 1, 4-6 hours)

1. **Create Server Module**
   - Entity with all fields
   - Service with CRUD operations
   - Controller with REST endpoints
   - DTOs for create/update/list
   - Migration

2. **Server Filters & Search**
   - Query builder for filters (category, region, language)
   - Text search on name/description
   - Sorting (votes, playerCount, createdAt)
   - Pagination

3. **Server Ownership & Permissions**
   - Guard to check server ownership
   - Only owner or admin can edit/delete
   - Status workflow (pending → approved/rejected)

---

### 🔴 **Phase 2: Voting System** (Day 1-2, 2-4 hours)

1. **Create Vote Module**
   - Entity with 24-hour constraint
   - Service with voting logic
   - Reward code generation
   - Cooldown validation

2. **Vote Endpoints**
   - POST vote with cooldown check
   - GET can-vote status
   - GET verify code
   - GET vote history

3. **Vote Statistics**
   - Monthly vote count (reset UTC 1st of month)
   - All-time vote count
   - Top voted servers

---

### 🟡 **Phase 3: Admin Panel** (Day 2, 2-3 hours)

1. **Admin Endpoints**
   - GET pending servers
   - PATCH approve server
   - PATCH reject server
   - GET user list
   - PATCH ban/unban user

2. **Admin Guard**
   - Use existing RBAC system
   - Create `admin` role
   - Protect admin endpoints

---

### 🟡 **Phase 4: Server Staff** (Week 2, Optional)

1. **Create ServerStaff Module**
   - Entity linking servers to staff
   - CRUD for staff positions
   - Open positions listing

---

### 🟢 **Phase 5: Reviews** (Week 3-4, Optional)

1. **Create Review Module**
   - 5-star rating system
   - Comment validation
   - Upvote/downvote system

---

## File Structure Plan

```
apps/api/src/app/
├── auth/               ✅ EXISTS - KEEP AS IS
├── user/               ✅ EXISTS - EXTEND
│   └── user.entity.ts  📝 MODIFY (add username, avatarUrl, bio, etc.)
├── rbac/               ✅ EXISTS - USE FOR ADMIN
├── server/             🆕 CREATE
│   ├── server.entity.ts
│   ├── server.module.ts
│   ├── server.controller.ts
│   ├── server.service.ts
│   ├── dto/
│   │   ├── create-server.dto.ts
│   │   ├── update-server.dto.ts
│   │   ├── list-servers.dto.ts
│   │   └── server-response.dto.ts
│   └── guards/
│       └── server-owner.guard.ts
├── vote/               🆕 CREATE
│   ├── vote.entity.ts
│   ├── vote.module.ts
│   ├── vote.controller.ts
│   ├── vote.service.ts
│   └── dto/
│       ├── vote.dto.ts
│       └── verify-code.dto.ts
├── server-staff/       🆕 CREATE (Phase 4)
│   ├── server-staff.entity.ts
│   ├── server-staff.module.ts
│   ├── server-staff.controller.ts
│   └── server-staff.service.ts
├── review/             🆕 CREATE (Phase 5)
│   ├── review.entity.ts
│   ├── review.module.ts
│   ├── review.controller.ts
│   └── review.service.ts
├── admin/              🆕 CREATE (Phase 3)
│   ├── admin.controller.ts
│   └── admin.service.ts
├── product/            ❌ DELETE OR IGNORE
├── organization/       🤔 KEEP FOR COMMUNITIES (Phase 2)
├── health/             ✅ KEEP
└── theme/              ❓ OPTIONAL - KEEP IF FRONTEND USES IT
```

---

## Migration Strategy

### 1. Create New Entities First
```bash
# Generate migrations for each new entity
pnpm migration:generate AddServerEntity
pnpm migration:generate AddVoteEntity
pnpm migration:generate AddServerStaffEntity
pnpm migration:generate AddReviewEntity
```

### 2. Modify User Entity
```bash
pnpm migration:generate ExtendUserForHyNexus
```

### 3. Run All Migrations
```bash
pnpm migration:run
```

---

## Database Schema Summary

### Tables You'll Have:

```
✅ users (EXTEND)
   - Add: username, avatarUrl, bio, discordId, emailVerified, isBanned, lastLogin

✅ roles (KEEP)
✅ permissions (KEEP)
✅ user_roles (KEEP)
✅ role_permissions (KEEP)
✅ refresh_tokens (KEEP)
✅ organizations (KEEP FOR PHASE 2 - COMMUNITIES)
✅ user_organizations (KEEP)

🆕 servers (CREATE)
🆕 votes (CREATE)
🆕 server_staff (CREATE - PHASE 4)
🆕 reviews (CREATE - PHASE 5)
🆕 server_tags (CREATE - OPTIONAL)
🆕 user_favorites (CREATE - PHASE 2)
🆕 achievements (CREATE - PHASE 2)
🆕 user_achievements (CREATE - PHASE 2)

❌ products (DELETE OR IGNORE)
```

---

## Quick Start Checklist

### Day 1 Backend (4-6 hours)
- [ ] Extend User entity with HyNexus fields
- [ ] Create Server entity & module
- [ ] Create Vote entity & module
- [ ] Implement server CRUD endpoints
- [ ] Implement voting endpoints with 24h cooldown
- [ ] Create admin approval endpoints
- [ ] Test with curl/Postman

### Day 2 Frontend (4-6 hours)
- [ ] Server listing page with filters
- [ ] Server detail page
- [ ] Vote button with cooldown UI
- [ ] Server submission form
- [ ] Admin moderation panel
- [ ] User dashboard

---

## Next Steps

1. **Review this gap analysis** - Confirm the approach
2. **Start with User entity modifications** - Quick win
3. **Create Server module** - Core functionality
4. **Create Vote module** - Critical feature
5. **Admin panel** - For moderation
6. **Test everything** - E2E workflow

Would you like me to:
1. ✅ Create the extended User entity migration?
2. ✅ Create the Server module (entity, service, controller, DTOs)?
3. ✅ Create the Vote module with 24h cooldown logic?
4. ✅ Create the Admin controller for approvals?

Let me know which one to start with!
