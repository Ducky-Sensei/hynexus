import type { Theme } from '@hynexus/types';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ServerThemeResponseDto {
    @Expose()
    serverId: string;

    @Expose()
    serverSlug: string;

    @Expose()
    serverName: string;

    @Expose()
    theme: Theme;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}
