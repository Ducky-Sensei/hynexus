import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './server.controller';
import { Server } from './server.entity';
import { ServerService } from './server.service';

@Module({
    imports: [TypeOrmModule.forFeature([Server])],
    providers: [ServerService],
    controllers: [ServerController],
    exports: [ServerService],
})
export class ServerModule {}
