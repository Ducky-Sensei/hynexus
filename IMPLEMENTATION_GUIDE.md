# HyNexus Implementation Guide

**Project**: Hytale Community Server Listing Platform
**Launch Target**: January 13, 2026
**Time Available**: 2 days

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Phase 1: MVP Implementation (Days 1-2)](#phase-1-mvp-implementation-days-1-2)
4. [Phase 2: Enhanced Features (Week 2-4)](#phase-2-enhanced-features-week-2-4)
5. [Phase 3: API Integration (Month 2)](#phase-3-api-integration-month-2)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Guide](#deployment-guide)
8. [Post-Launch Operations](#post-launch-operations)

---

## Project Overview

### What We're Building

A community-driven Hytale server listing platform that differentiates itself through:

- **Community-First Design**: User profiles and cross-server communities
- **Staff Discovery System**: Help servers recruit moderators and staff
- **Enhanced User Profiles**: Track activity, achievements, contributions
- **Transparent Metrics**: Real engagement data
- **Multi-Page Architecture**: User profiles, server pages, community pages

### Tech Stack Summary

**Backend**: NestJS, TypeORM, PostgreSQL, Redis
**Frontend**: React, Vite, TanStack Router/Query, Tailwind CSS
**Shared**: TypeScript, Zod schemas
**Infrastructure**: Docker, Nginx, GitHub Actions

---

## Development Environment Setup

### Prerequisites

```bash
# Required software
- Node.js >= 20.0.0
- pnpm >= 10.0.0
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)
```

### Initial Setup

```bash
# 1. Clone and install dependencies
cd hynexus
pnpm install

# 2. Setup environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Start development servers (with auto-provisioned DB)
pnpm dev

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/api/docs
```

### Database Setup

The backend uses Testcontainers, so PostgreSQL and Redis are automatically started in Docker when you run `pnpm dev`.

If you prefer manual Docker setup:

```bash
# Start PostgreSQL and Redis manually
docker compose -f apps/api/docker-compose.dev.yml up -d

# Run migrations
pnpm migration:run

# Seed database (optional)
pnpm db:seed
```

---

## Phase 1: MVP Implementation (Days 1-2)

### Day 1 - Backend Foundation (8 hours)

#### 1.1 Database Schema Implementation (2 hours)

**Priority**: CRITICAL
**Files to Create/Modify**:

- `apps/api/src/database/entities/user.entity.ts`
- `apps/api/src/database/entities/server.entity.ts`
- `apps/api/src/database/entities/vote.entity.ts`
- `apps/api/src/database/entities/server-staff.entity.ts`
- `apps/api/src/database/entities/review.entity.ts`

**Implementation Steps**:

```typescript
// 1. Create User Entity
// apps/api/src/database/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 20 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ nullable: true, length: 500 })
  avatarUrl?: string;

  @Column({ type: "text", nullable: true })
  bio?: string;

  @Column({ nullable: true, length: 100 })
  discordId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, length: 100 })
  verificationToken?: string;

  // Relations
  @OneToMany(() => Server, (server) => server.owner)
  servers: Server[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}

// 2. Create Server Entity
// 3. Create Vote Entity
// 4. Create ServerStaff Entity
// 5. Create Review Entity
// (Follow similar pattern for each entity based on schema in HyNexus.md)
```

**Generate Migration**:

```bash
pnpm migration:generate CreateInitialSchema
pnpm migration:run
```

#### 1.2 Authentication System (2 hours)

**Priority**: CRITICAL
**Features to Implement**:

- JWT-based authentication
- Email + password registration
- Login endpoint
- Token refresh
- Password hashing with bcrypt

**Files to Create**:

- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/modules/auth/dto/register.dto.ts`
- `apps/api/src/modules/auth/dto/login.dto.ts`

**Implementation Steps**:

```typescript
// 1. Create DTOs with Zod validation
// apps/api/src/modules/auth/dto/register.dto.ts
import { z } from "zod";

export const RegisterDtoSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

// 2. Implement Auth Service
// 3. Create JWT Strategy
// 4. Set up Auth Controller with endpoints:
//    - POST /v1/auth/register
//    - POST /v1/auth/login
//    - POST /v1/auth/refresh
//    - GET /v1/auth/me
```

**Test**:

```bash
# Register user
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

#### 1.3 Server Management (2 hours)

**Priority**: CRITICAL
**Features to Implement**:

- Create server listing
- Get server details
- List servers with filters
- Update server
- Delete server

**Files to Create**:

- `apps/api/src/modules/servers/servers.module.ts`
- `apps/api/src/modules/servers/servers.controller.ts`
- `apps/api/src/modules/servers/servers.service.ts`
- `apps/api/src/modules/servers/dto/create-server.dto.ts`
- `apps/api/src/modules/servers/dto/update-server.dto.ts`
- `apps/api/src/modules/servers/dto/list-servers.dto.ts`

**Endpoints to Implement**:

```typescript
POST   /v1/servers              - Create server (auth required)
GET    /v1/servers              - List servers with filters
GET    /v1/servers/:id          - Get server details
PUT    /v1/servers/:id          - Update server (owner/admin only)
DELETE /v1/servers/:id          - Delete server (owner/admin only)
```

**Filter Support**:

- Category (Survival, PvP, Creative, Minigames, RPG, Roleplay, Anarchy)
- Region (NA, EU, Asia, Oceania, SA)
- Language
- Status (online only)
- Sort by: votes, player count, recently added

#### 1.4 Voting System (2 hours)

**Priority**: CRITICAL
**Features to Implement**:

- Vote for server (once per 24 hours per user)
- Generate unique reward code
- Vote verification endpoint
- Monthly vote ranking

**Files to Create**:

- `apps/api/src/modules/votes/votes.module.ts`
- `apps/api/src/modules/votes/votes.controller.ts`
- `apps/api/src/modules/votes/votes.service.ts`
- `apps/api/src/modules/votes/dto/vote.dto.ts`

**Implementation Steps**:

```typescript
// 1. Vote endpoint with 24-hour cooldown check
POST /v1/servers/:id/vote

// 2. Generate 8-character reward code
function generateRewardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// 3. Vote verification
GET /v1/votes/verify/:code

// 4. Get server vote stats
GET /v1/servers/:id/votes
```

**Validation Rules**:

- User must be authenticated
- Cannot vote for same server within 24 hours
- IP address logging for fraud detection
- Monthly ranking reset (UTC midnight, 1st of month)

### Day 1 - Frontend Foundation (8 hours)

#### 1.5 Project Structure Setup (1 hour)

**Priority**: CRITICAL

**Create Directory Structure**:

```
apps/web/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── types/
│   ├── servers/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── votes/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── servers/
│   │   ├── index.tsx
│   │   └── $serverId.tsx
│   └── dashboard.tsx
├── lib/
│   ├── api-client.ts
│   └── utils.ts
└── components/
    └── ui/
```

#### 1.6 API Client Setup (1 hour)

**Priority**: CRITICAL
**File to Create**: `apps/web/src/lib/api-client.ts`

```typescript
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_VERSION = import.meta.env.VITE_API_VERSION || "v1";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${API_BASE_URL}/${API_VERSION}/auth/refresh`,
          {
            refreshToken,
          },
        );

        localStorage.setItem("accessToken", data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

#### 1.7 Authentication UI (2 hours)

**Priority**: CRITICAL
**Components to Create**:

- Registration form
- Login form
- Auth context/store

**Files to Create**:

- `apps/web/src/features/auth/components/register-form.tsx`
- `apps/web/src/features/auth/components/login-form.tsx`
- `apps/web/src/features/auth/hooks/use-auth.ts`
- `apps/web/src/routes/register.tsx`
- `apps/web/src/routes/login.tsx`

**Implementation**:

```tsx
// apps/web/src/features/auth/components/register-form.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) => apiClient.post("/auth/register", data),
    onSuccess: () => {
      // Redirect to login or show success message
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...register("username")} placeholder="Username" />
        {errors.username && (
          <p className="text-red-500">{errors.username.message}</p>
        )}
      </div>
      <div>
        <Input {...register("email")} type="email" placeholder="Email" />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <Input
          {...register("password")}
          type="password"
          placeholder="Password"
        />
        {errors.password && (
          <p className="text-red-500">{errors.password.message}</p>
        )}
      </div>
      <div>
        <Input
          {...register("confirmPassword")}
          type="password"
          placeholder="Confirm Password"
        />
        {errors.confirmPassword && (
          <p className="text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Registering..." : "Register"}
      </Button>
    </form>
  );
}
```

#### 1.8 Server Listing UI (2 hours)

**Priority**: CRITICAL
**Components to Create**:

- Server grid/list view
- Server card component
- Filter sidebar
- Server detail page

**Files to Create**:

- `apps/web/src/features/servers/components/server-card.tsx`
- `apps/web/src/features/servers/components/server-list.tsx`
- `apps/web/src/features/servers/components/server-filters.tsx`
- `apps/web/src/routes/servers/index.tsx`
- `apps/web/src/routes/servers/$serverId.tsx`

**Implementation**:

```tsx
// apps/web/src/features/servers/components/server-card.tsx
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Copy } from "lucide-react";

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    description: string;
    bannerUrl?: string;
    category: string;
    region: string;
    playerCount: number;
    maxPlayers: number;
    votesMonthly: number;
    isOnline: boolean;
    ipAddress: string;
    port: number;
  };
}

export function ServerCard({ server }: ServerCardProps) {
  const copyIP = () => {
    navigator.clipboard.writeText(`${server.ipAddress}:${server.port}`);
    // Show toast notification
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {server.bannerUrl && (
        <img
          src={server.bannerUrl}
          alt={server.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold">{server.name}</h3>
          <Badge variant={server.isOnline ? "success" : "destructive"}>
            {server.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {server.description}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {server.playerCount}/{server.maxPlayers}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{server.votesMonthly} votes</span>
          </div>
          <Badge variant="outline">{server.category}</Badge>
          <Badge variant="outline">{server.region}</Badge>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to="/servers/$serverId" params={{ serverId: server.id }}>
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={copyIP}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

#### 1.9 Voting UI (1 hour)

**Priority**: CRITICAL
**Component to Create**: Vote button with cooldown

**File**: `apps/web/src/features/votes/components/vote-button.tsx`

```tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface VoteButtonProps {
  serverId: string;
}

export function VoteButton({ serverId }: VoteButtonProps) {
  // Check if user can vote
  const { data: canVote } = useQuery({
    queryKey: ["canVote", serverId],
    queryFn: () => apiClient.get(`/servers/${serverId}/can-vote`),
  });

  const voteMutation = useMutation({
    mutationFn: () => apiClient.post(`/servers/${serverId}/vote`),
    onSuccess: (response) => {
      const rewardCode = response.data.rewardCode;
      toast.success(`Voted successfully! Your reward code: ${rewardCode}`, {
        duration: 10000,
        action: {
          label: "Copy Code",
          onClick: () => navigator.clipboard.writeText(rewardCode),
        },
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to vote");
    },
  });

  const timeUntilNextVote = canVote?.data?.timeUntilNextVote;
  const hoursRemaining = timeUntilNextVote
    ? Math.ceil(timeUntilNextVote / 3600000)
    : 0;

  return (
    <Button
      onClick={() => voteMutation.mutate()}
      disabled={!canVote?.data?.canVote || voteMutation.isPending}
      className="w-full"
    >
      <ThumbsUp className="mr-2 h-4 w-4" />
      {voteMutation.isPending
        ? "Voting..."
        : !canVote?.data?.canVote
          ? `Vote again in ${hoursRemaining}h`
          : "Vote for this Server"}
    </Button>
  );
}
```

#### 1.10 Server Submission Form (1 hour)

**Priority**: CRITICAL
**File**: `apps/web/src/features/servers/components/server-form.tsx`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const serverSchema = z.object({
  name: z.string().min(3).max(100),
  ipAddress: z.string().min(1),
  port: z.number().min(1).max(65535).default(3000),
  category: z.enum([
    "Survival",
    "PvP",
    "Creative",
    "Minigames",
    "RPG",
    "Roleplay",
    "Anarchy",
  ]),
  region: z.enum(["NA", "EU", "Asia", "Oceania", "SA"]),
  language: z.string().default("en"),
  maxPlayers: z.number().min(1),
  description: z.string().min(50).max(5000),
  websiteUrl: z.string().url().optional(),
  discordUrl: z.string().url().optional(),
});

type ServerForm = z.infer<typeof serverSchema>;

export function ServerSubmissionForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ServerForm) => apiClient.post("/servers", data),
    onSuccess: () => {
      // Redirect to pending approval page
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
      {/* Form fields */}
    </form>
  );
}
```

### Day 2 - Polish & Launch Prep (8 hours)

#### 2.1 Search & Filtering (2 hours)

**Priority**: HIGH
**Features**:

- Text search by server name
- Filter by category, region, language
- Sort by votes, player count, recently added

**Implementation**:

```typescript
// Backend: Add query parameters to GET /v1/servers
interface ListServersQuery {
  search?: string;
  category?: string[];
  region?: string[];
  language?: string;
  sortBy?: "votes" | "playerCount" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Frontend: Update filter component
```

#### 2.2 User Dashboard (1 hour)

**Priority**: MEDIUM
**Features**:

- View owned servers
- Recent votes
- Basic statistics

**File**: `apps/web/src/routes/dashboard.tsx`

#### 2.3 Admin Moderation Panel (2 hours)

**Priority**: HIGH
**Features**:

- Review pending server submissions
- Approve/reject servers
- Ban users
- View reports

**Files**:

- `apps/web/src/routes/admin/pending-servers.tsx`
- `apps/web/src/routes/admin/users.tsx`

#### 2.4 Mobile Responsiveness (1 hour)

**Priority**: HIGH
**Task**: Test and fix mobile layouts

```bash
# Test on different viewports
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px+
```

#### 2.5 Testing & Bug Fixes (2 hours)

**Priority**: CRITICAL

**Test Checklist**:

```bash
# Authentication
□ Register new user
□ Login with correct credentials
□ Login with wrong credentials
□ Token refresh works
□ Logout clears tokens

# Servers
□ Create new server listing
□ View server list
□ Filter servers by category
□ Search servers by name
□ View server details

# Voting
□ Vote for server
□ Cannot vote twice within 24 hours
□ Reward code is displayed
□ Vote count increases

# Admin
□ Pending servers appear in queue
□ Can approve server
□ Can reject server
□ Approved server appears in listing
```

---

## Phase 2: Enhanced Features (Week 2-4)

### Week 2: User Profiles & Analytics

#### 2.1 Enhanced User Profiles (3 days)

**Features**:

- Extended bio with social links
- Badges and achievements
- Activity timeline
- Favorite servers showcase

**Database Changes**:

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  icon_url VARCHAR(500),
  type VARCHAR(50),
  requirement_value INTEGER
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP
);

CREATE TABLE user_favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  server_id UUID REFERENCES servers(id),
  added_at TIMESTAMP
);
```

**Achievements to Implement**:

- Vote Milestones: 10, 50, 100, 500, 1000 votes
- Server Loyalty: Voted X days in a row
- Early Adopter: Registered in first week
- Server Owner: Own a server

#### 2.2 Server Owner Dashboard (2 days)

**Features**:

- Vote trends chart (daily/weekly/monthly)
- Profile views analytics
- Vote sources tracking
- Review summary

**Implementation**:

```typescript
// Backend: Analytics aggregation
GET /v1/servers/:id/analytics

// Frontend: Chart.js or Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
```

### Week 3: Staff Recruitment

#### 3.1 Job Listings System (3 days)

**Database Schema**:

```sql
CREATE TABLE job_listings (
  id UUID PRIMARY KEY,
  server_id UUID REFERENCES servers(id),
  title VARCHAR(100),
  position_type VARCHAR(50),
  description TEXT,
  requirements TEXT,
  time_commitment VARCHAR(100),
  compensation TEXT,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE job_applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES job_listings(id),
  user_id UUID REFERENCES users(id),
  cover_letter TEXT,
  experience TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP
);
```

**Features**:

- Post staff openings (Moderator, Builder, Developer, Admin)
- Application submission
- Application management for server owners
- Staff position filtering

### Week 4: Community Features

#### 4.1 Community Pages (3 days)

**Database Schema**:

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  banner_url VARCHAR(500),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  member_count INTEGER DEFAULT 0
);

CREATE TABLE community_members (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP
);
```

**Features**:

- Create cross-server communities
- Discussion boards
- Event calendar
- Member directory

#### 4.2 Reviews System (2 days)

**Features**:

- 5-star rating system
- Written reviews
- Upvote/downvote reviews
- Review moderation

---

## Phase 3: API Integration (Month 2)

### Once Hytale API is Available

#### 3.1 Automated Server Status Checking

**Implementation**:

```typescript
// Create background job to ping servers
// apps/api/src/modules/servers/jobs/server-ping.job.ts

import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as dgram from "dgram";

@Injectable()
export class ServerPingJob {
  @Cron(CronExpression.EVERY_5_MINUTES)
  async pingServers() {
    const servers = await this.serversService.findAll();

    for (const server of servers) {
      const status = await this.checkServerStatus(
        server.ipAddress,
        server.port,
      );
      await this.serversService.updateStatus(server.id, status);
    }
  }

  private async checkServerStatus(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const client = dgram.createSocket("udp4");
      const timeout = setTimeout(() => {
        client.close();
        resolve(false);
      }, 5000);

      // Send QUIC handshake packet
      const packet = Buffer.from([0x00, 0x00, 0x00, 0x01]);

      client.send(packet, port, ip);

      client.on("message", () => {
        clearTimeout(timeout);
        client.close();
        resolve(true);
      });
    });
  }
}
```

#### 3.2 Automatic Vote Verification

**Implementation**:

```typescript
// Create Hytale plugin (Java)
// HyNexusVoteListener.java

public class HyNexusVoteListener implements VoteListener {
  private final String apiUrl = "https://hynexus.com/api/v1/votes/verify";

  @EventHandler
  public void onVote(VoteEvent event) {
    String playerName = event.getPlayer().getName();
    String voteCode = event.getVoteCode();

    // Verify vote with API
    HttpResponse<String> response = HttpClient.newHttpClient()
      .send(
        HttpRequest.newBuilder()
          .uri(URI.create(apiUrl + "/" + voteCode))
          .GET()
          .build(),
        HttpResponse.BodyHandlers.ofString()
      );

    if (response.statusCode() == 200) {
      // Vote is valid, give player reward
      giveReward(event.getPlayer());
    }
  }
}
```

#### 3.3 Public API for Third Parties

**Endpoints**:

```typescript
// Read Endpoints (No Auth)
GET /api/v1/servers?category=PvP&region=NA
GET /api/v1/servers/:id
GET /api/v1/servers/:id/votes
GET /api/v1/users/:id

// Server Owner Endpoints (Auth Required)
POST /api/v1/votes/verify
GET /api/v1/servers/:id/analytics
POST /api/v1/servers/:id/status

// Webhooks
POST /api/v1/webhooks/vote/:serverId
POST /api/v1/webhooks/review/:serverId
```

---

## Testing Strategy

### Unit Tests

```bash
# Backend (NestJS + Jest)
pnpm test:api

# Coverage target: 80%+
pnpm test:cov
```

**Critical Tests**:

```typescript
// auth.service.spec.ts
describe("AuthService", () => {
  it("should hash password on registration", async () => {
    const result = await authService.register({
      username: "test",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.passwordHash).not.toBe("password123");
  });

  it("should generate JWT token on login", async () => {
    const result = await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.accessToken).toBeDefined();
  });
});

// votes.service.spec.ts
describe("VotesService", () => {
  it("should prevent voting twice within 24 hours", async () => {
    await votesService.vote(userId, serverId);

    await expect(votesService.vote(userId, serverId)).rejects.toThrow(
      "You can only vote once every 24 hours",
    );
  });

  it("should generate unique reward code", async () => {
    const vote = await votesService.vote(userId, serverId);
    expect(vote.rewardCode).toMatch(/^[A-Z0-9]{8}$/);
  });
});
```

### Integration Tests

```bash
# E2E tests with Testcontainers
pnpm test:e2e
```

**Test Scenarios**:

```typescript
describe("Server Voting Flow (E2E)", () => {
  it("should complete full voting workflow", async () => {
    // 1. Register user
    const registerResponse = await request(app.getHttpServer())
      .post("/v1/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "Test1234",
      });

    expect(registerResponse.status).toBe(201);

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: "test@example.com",
        password: "Test1234",
      });

    const { accessToken } = loginResponse.body;

    // 3. Create server
    const serverResponse = await request(app.getHttpServer())
      .post("/v1/servers")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Test Server",
        ipAddress: "127.0.0.1",
        port: 3000,
        category: "Survival",
        region: "NA",
        description: "A test server for e2e testing",
      });

    const serverId = serverResponse.body.id;

    // 4. Vote for server
    const voteResponse = await request(app.getHttpServer())
      .post(`/v1/servers/${serverId}/vote`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(voteResponse.status).toBe(201);
    expect(voteResponse.body.rewardCode).toMatch(/^[A-Z0-9]{8}$/);
  });
});
```

### Frontend E2E Tests (Playwright)

```bash
pnpm test:e2e
```

**Test Scenarios**:

```typescript
// tests/voting-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can vote for server and receive reward code", async ({ page }) => {
  // 1. Go to homepage
  await page.goto("http://localhost:3000");

  // 2. Register
  await page.click("text=Register");
  await page.fill('input[name="username"]', "testuser");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "Test1234");
  await page.fill('input[name="confirmPassword"]', "Test1234");
  await page.click('button[type="submit"]');

  // 3. Login
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "Test1234");
  await page.click('button[type="submit"]');

  // 4. Find a server and vote
  await page.goto("http://localhost:3000/servers");
  await page.click(".server-card >> nth=0");
  await page.click('button:has-text("Vote for this Server")');

  // 5. Verify reward code is shown
  await expect(
    page.locator("text=/Your reward code: [A-Z0-9]{8}/"),
  ).toBeVisible();
});
```

---

## Deployment Guide

### Environment Configuration

#### Backend Environment Variables

```env
# Production .env for apps/api
NODE_ENV=production
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@db:5432/hynexus_prod
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# Redis
REDIS_URL=redis://redis:6379
CACHE_ENABLED=true
CACHE_TYPE=redis

# Security
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
CORS_ORIGIN=https://hynexus.com

# Monitoring
SENTRY_ENABLED=true
SENTRY_DSN=<your-sentry-dsn>
PROMETHEUS_ENABLED=true

# Email (for verification)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=<your-sendgrid-key>
```

#### Frontend Environment Variables

```env
# Production .env for apps/web
VITE_API_BASE_URL=https://api.hynexus.com
VITE_API_VERSION=v1

# Monitoring
VITE_SENTRY_ENABLED=true
VITE_SENTRY_DSN=<your-sentry-dsn>
VITE_DATADOG_ENABLED=true
VITE_DATADOG_APPLICATION_ID=<your-app-id>
VITE_DATADOG_CLIENT_TOKEN=<your-token>
```

### Docker Deployment

```bash
# 1. Build images
docker build -t hynexus-api:latest -f apps/api/Dockerfile .
docker build -t hynexus-web:latest -f apps/web/Dockerfile .

# 2. Push to registry
docker tag hynexus-api:latest registry.example.com/hynexus-api:latest
docker push registry.example.com/hynexus-api:latest

docker tag hynexus-web:latest registry.example.com/hynexus-web:latest
docker push registry.example.com/hynexus-web:latest

# 3. Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

**Production docker-compose.yml**:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hynexus_prod
      POSTGRES_USER: hynexus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  api:
    image: registry.example.com/hynexus-api:latest
    environment:
      DATABASE_URL: postgresql://hynexus:${DB_PASSWORD}@postgres:5432/hynexus_prod
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    ports:
      - "8000:8000"

  web:
    image: registry.example.com/hynexus-web:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl

volumes:
  postgres_data:
  redis_data:
```

### Database Migrations

```bash
# Run migrations in production
docker exec hynexus-api pnpm migration:run

# Or SSH into server and run
ssh production-server
cd /opt/hynexus
pnpm migration:run
```

### SSL Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d hynexus.com -d www.hynexus.com -d api.hynexus.com

# Auto-renewal
sudo certbot renew --dry-run
```

### CDN Setup (Cloudflare)

1. Point DNS to Cloudflare
2. Enable proxy for:
   - hynexus.com
   - www.hynexus.com
   - api.hynexus.com
3. Configure caching rules:
   - Cache static assets: `/assets/*`
   - Bypass API: `/api/*`

### Monitoring Setup

**Sentry**:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create release
sentry-cli releases new hynexus@1.0.0
sentry-cli releases files hynexus@1.0.0 upload-sourcemaps ./dist
sentry-cli releases finalize hynexus@1.0.0
```

**Uptime Monitoring**:

- Use UptimeRobot or Pingdom
- Monitor: https://hynexus.com, https://api.hynexus.com/health

---

## Post-Launch Operations

### Daily Tasks (Week 1)

```bash
□ Review and approve pending servers (morning, afternoon)
□ Moderate user-submitted content
□ Respond to support requests
□ Monitor error logs (Sentry)
□ Check server uptime
□ Review user feedback
```

### Weekly Tasks

```bash
□ Analyze user metrics (new registrations, active users)
□ Review vote patterns for fraud
□ Database backup verification
□ Security updates
□ Feature request prioritization
□ Community engagement (Discord, Reddit)
```

### Monthly Tasks

```bash
□ Monthly vote ranking announcement
□ Platform statistics report
□ Server owner satisfaction survey
□ Security audit
□ Performance optimization review
```

### Scaling Considerations

**When to scale**:

- Response time > 500ms average
- Database connections > 80% pool
- Redis memory > 80%
- Server CPU > 70% sustained

**Scaling strategies**:

1. **Horizontal scaling**: Add more API instances behind load balancer
2. **Database read replicas**: For read-heavy queries
3. **Redis cluster**: For distributed caching
4. **CDN**: Cloudflare for static assets

---

## Quick Reference Commands

```bash
# Development
pnpm dev                 # Start both API and Web
pnpm dev:api            # Backend only
pnpm dev:web            # Frontend only

# Building
pnpm build              # Build all
pnpm build:api          # Backend only
pnpm build:web          # Frontend only

# Testing
pnpm test               # All tests
pnpm test:e2e          # E2E tests
pnpm test:coverage      # With coverage

# Database
pnpm migration:generate # Create migration
pnpm migration:run      # Run migrations
pnpm db:seed           # Seed database

# Production
docker-compose up -d    # Start prod stack
docker logs -f api      # View API logs
docker exec -it api sh  # Shell into container
```

---

## Support & Resources

### Documentation

- [NestJS Docs](https://docs.nestjs.com)
- [React Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [TypeORM](https://typeorm.io)

### Community

- Discord: [Create server]
- Reddit: r/HytaleInfo
- Email: support@hynexus.com

---

**Last Updated**: 2026-01-11
**Version**: 1.0
**Status**: Ready for Implementation
