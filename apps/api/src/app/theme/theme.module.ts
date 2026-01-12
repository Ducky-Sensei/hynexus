import { Module } from '@nestjs/common';
import { ServerModule } from '../server/server.module';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';

@Module({
    imports: [ServerModule],
    controllers: [ThemeController],
    providers: [ThemeService],
    exports: [ThemeService],
})
export class ThemeModule {}
