import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ServerThemeResponseDto } from './dto/server-theme-response.dto';
import { ThemeService } from './theme.service';

@Controller('v1/themes')
export class ThemeController {
    constructor(private readonly themeService: ThemeService) {}

    @Public()
    @Get('server/:slug')
    async getServerTheme(@Param('slug') slug: string): Promise<ServerThemeResponseDto> {
        return this.themeService.getServerTheme(slug);
    }
}
