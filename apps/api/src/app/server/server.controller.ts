import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import {
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions, Roles } from '../rbac/decorators';
import { PermissionsGuard, PlatformAdminGuard, RolesGuard } from '../rbac/guards';
import { CreateServerDto, ServerResponseDto, UpdateServerDto } from './server.dto';
import { ServerService } from './server.service';

@ApiTags('v1/servers')
@Controller({
    path: 'servers',
    version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ServerController {
    constructor(private readonly serverService: ServerService) {}

    @ApiOperation({ summary: 'Get all servers' })
    @ApiOkResponse({
        description: 'List of all servers',
        type: [ServerResponseDto],
    })
    @Get()
    findAll(): Promise<ServerResponseDto[]> {
        return this.serverService.findAll();
    }

    @ApiOperation({ summary: 'Get a server by ID' })
    @ApiParam({ name: 'id', description: 'Server ID (UUID)', type: String })
    @ApiOkResponse({
        description: 'Server details',
        type: ServerResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Server not found' })
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ServerResponseDto> {
        return this.serverService.findOne(id);
    }

    @ApiOperation({ summary: 'Get a server by slug' })
    @ApiParam({ name: 'slug', description: 'Server slug', type: String })
    @ApiOkResponse({
        description: 'Server details',
        type: ServerResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Server not found' })
    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string): Promise<ServerResponseDto> {
        return this.serverService.findBySlug(slug);
    }

    @ApiOperation({ summary: 'Create a new server listing' })
    @ApiCreatedResponse({
        description: 'Server successfully created',
        type: ServerResponseDto,
    })
    @RequirePermissions('servers:create')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body() createServerDto: CreateServerDto,
        @CurrentUser('sub') userId: string,
    ): Promise<ServerResponseDto> {
        return this.serverService.create(createServerDto, userId);
    }

    @ApiOperation({ summary: 'Update an existing server' })
    @ApiParam({ name: 'id', description: 'Server ID (UUID)', type: String })
    @ApiOkResponse({
        description: 'Server successfully updated',
        type: ServerResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Server not found' })
    @RequirePermissions('servers:update')
    @Put(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateServerDto: UpdateServerDto,
        @CurrentUser('sub') userId: string,
    ): Promise<ServerResponseDto> {
        return this.serverService.update(id, updateServerDto, userId);
    }

    @ApiOperation({ summary: 'Delete a server' })
    @ApiParam({ name: 'id', description: 'Server ID (UUID)', type: String })
    @ApiNoContentResponse({ description: 'Server successfully deleted' })
    @ApiNotFoundResponse({ description: 'Server not found' })
    @RequirePermissions('servers:delete')
    @Roles('admin')
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        return this.serverService.delete(id, userId);
    }

    @ApiOperation({ summary: 'Approve a server (platform admin only)' })
    @ApiParam({ name: 'id', description: 'Server ID (UUID)', type: String })
    @ApiOkResponse({
        description: 'Server successfully approved',
        type: ServerResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Server not found' })
    @UseGuards(PlatformAdminGuard)
    @Patch(':id/approve')
    approve(@Param('id', ParseUUIDPipe) id: string): Promise<ServerResponseDto> {
        return this.serverService.approve(id);
    }

    @ApiOperation({ summary: 'Reject a server (platform admin only)' })
    @ApiParam({ name: 'id', description: 'Server ID (UUID)', type: String })
    @ApiOkResponse({
        description: 'Server successfully rejected',
        type: ServerResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Server not found' })
    @UseGuards(PlatformAdminGuard)
    @Patch(':id/reject')
    reject(@Param('id', ParseUUIDPipe) id: string): Promise<ServerResponseDto> {
        return this.serverService.reject(id);
    }
}
