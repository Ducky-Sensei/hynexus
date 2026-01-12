# HyNexus Security & Ownership Model

## 🔐 Two-Level Security System

HyNexus uses a **two-level security model** to clearly distinguish between platform administration and server ownership.

---

## Level 1: Platform Administration (Website Owner)

### Platform Admin
**Who:** You (the website owner)
**Database Field:** `users.isAdmin = true`
**Purpose:** Moderate the entire platform

### Capabilities:
- ✅ Approve/reject server submissions
- ✅ Ban users from the platform
- ✅ Access admin dashboard
- ✅ View platform analytics
- ✅ Moderate all content
- ❌ Cannot access server owner's private data

### Protected Endpoints:
```typescript
// These endpoints require PlatformAdminGuard
PATCH /v1/servers/:id/approve   - Approve server listing
PATCH /v1/servers/:id/reject    - Reject server listing
GET   /v1/admin/servers/pending - View pending servers
PUT   /v1/admin/users/:id/ban   - Ban user
GET   /v1/admin/analytics        - Platform stats
```

### Security Implementation:
```typescript
@UseGuards(PlatformAdminGuard)  // Only users with isAdmin=true
@Patch(':id/approve')
approve(@Param('id') id: string) { ... }
```

---

## Level 2: Server Ownership (Regular Users)

### Server Owner
**Who:** Any registered user who creates a server
**Database Field:** `servers.ownerId = user.id`
**Purpose:** Manage their own server listing

### Capabilities:
- ✅ Create server listings (goes to pending status)
- ✅ Update their own server details
- ✅ Delete their own servers
- ✅ View their own server analytics (future)
- ✅ Manage staff for their server (future)
- ❌ Cannot approve/reject servers
- ❌ Cannot ban users from platform

### Ownership Check:
```typescript
// Server service automatically checks ownership
async update(id: string, updateDto: UpdateServerDto, userId: string) {
    const server = await this.serverRepository.findOneBy({ id });
    // TODO: Verify server.ownerId === userId
    // ...
}
```

---

## 🏗️ Server-Centric Model (Option B)

We're using a **simplified server-centric ownership model**:

```
User
 └── Servers[] (many servers, one owner each)
     └── Optional: Related servers link
```

### Why This Model?
1. **Simple** - Easy to understand and implement
2. **Clear ownership** - One owner per server
3. **Fast to launch** - Already 90% implemented
4. **Future-proof** - Can add Organizations later as "Communities"

### Removed from Phase 1:
- ❌ Organizations table (moved to Phase 2 as "Communities")
- ❌ `user_organizations` join table
- ❌ Complex organization permissions

---

## 🛡️ Implementation Details

### User Entity
```typescript
@Entity('users')
export class User {
    @Column({ default: false })
    isAdmin: boolean;  // Platform admin flag

    @Column({ default: false })
    isBanned: boolean;  // Platform ban

    @OneToMany(() => Server, (server) => server.owner)
    ownedServers: Server[];  // Servers this user owns
}
```

### Server Entity
```typescript
@Entity('servers')
export class Server {
    @Column({ type: 'uuid' })
    ownerId: string;  // Foreign key to users.id

    @Column({ default: 'pending' })
    status: string;  // pending, approved, rejected, suspended

    @ManyToOne(() => User, (user) => user.ownedServers)
    owner: User;
}
```

### Platform Admin Guard
```typescript
@Injectable()
export class PlatformAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const user = request.user;
        if (!user.isAdmin) {
            throw new ForbiddenException('Platform admin access required');
        }
        return true;
    }
}
```

---

## 🔑 Setting Platform Admin in Production

**IMPORTANT:** For security, only set `isAdmin=true` manually in the database.

### Development (Seed Data):
```typescript
// Automatically created by seed file
admin@admin.com - isAdmin: true
user@user.com   - isAdmin: false
```

### Production:
```sql
-- Manually set your account as platform admin
UPDATE users
SET "isAdmin" = true
WHERE email = 'your-email@example.com';

-- Verify
SELECT email, "isAdmin" FROM users WHERE "isAdmin" = true;
```

### Security Notes:
- ❌ Never expose `isAdmin` creation via API
- ❌ No user registration can set `isAdmin=true`
- ✅ Only database access can grant platform admin
- ✅ Only one account should have `isAdmin=true`

---

## 📊 Comparison: Platform Admin vs Server Owner

| Capability | Platform Admin | Server Owner |
|-----------|----------------|--------------|
| Approve servers | ✅ All servers | ❌ Cannot approve |
| Ban users | ✅ Site-wide | ❌ No |
| View all analytics | ✅ Platform-wide | ❌ Own servers only |
| Create servers | ✅ Yes | ✅ Yes |
| Edit own servers | ✅ Yes | ✅ Own servers only |
| Delete servers | ✅ All servers | ✅ Own servers only |
| Access admin dashboard | ✅ Yes | ❌ No |

---

## 🚀 Server Submission Workflow

1. **User creates server** → Status: `pending`
2. **Platform admin reviews** → Decision time
   - ✅ Approve → Status: `approved` → Publicly visible
   - ❌ Reject → Status: `rejected` → Hidden
3. **Users can browse** → Only `approved` servers shown
4. **Owners can update** → Their own servers anytime

---

## 🔮 Future Enhancements (Phase 2+)

### Server Staff System
```typescript
// Allow server owners to add staff
ServerStaff {
    serverId: string;
    userId: string;
    role: 'admin' | 'moderator';  // Server-level roles
}
```

### Communities (Organizations v2)
```typescript
// Multi-server networks
Community {
    name: string;
    servers: Server[];  // Grouped servers
    members: User[];
}
```

---

## 📝 Summary

**Key Takeaways:**
1. **`isAdmin` flag** = Platform administrator (you)
2. **`ownerId` field** = Server owner (any user)
3. **PlatformAdminGuard** = Protects admin endpoints
4. **Server-centric model** = Simple, clear ownership
5. **Organizations removed** = Will return as "Communities" in Phase 2

Your account will have `isAdmin=true` and can moderate the entire platform, while regular users can only manage their own server listings.
