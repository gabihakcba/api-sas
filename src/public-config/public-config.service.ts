import { ForbiddenException, Injectable } from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { mkdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfiguracionGrupoDto } from './dto/update-configuracion-grupo.dto';

interface UploadedBrandingFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const DEFAULT_GROUP_NAME =
  process.env.GRUPO_NOMBRE?.trim() || 'Grupo Scout Adalberto O. Lopez 494';

@Injectable()
export class PublicConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfiguracionGrupo() {
    const config = await this.prisma.configuracionGrupo.findFirst({
      where: { id: 1 },
      select: {
        nombre_grupo: true,
        url_logo: true,
        url_favicon: true,
        theme_web: true,
        theme_mobile: true,
        updatedAt: true,
      },
    });

    if (config) {
      return config;
    }

    return {
      nombre_grupo: DEFAULT_GROUP_NAME,
      url_logo: '/logo.png',
      url_favicon: '/favicon.ico',
      theme_web: 'lara-light-blue',
      theme_mobile: 'md3-light',
      updatedAt: new Date(0),
    };
  }

  async getManagedConfiguracionGrupo(user: AuthenticatedUser) {
    this.ensureManagementAccess(user);
    return this.getConfiguracionGrupo();
  }

  async updateConfiguracionGrupo(
    user: AuthenticatedUser,
    dto: UpdateConfiguracionGrupoDto,
    files: {
      logo?: UploadedBrandingFile;
      favicon?: UploadedBrandingFile;
    },
  ) {
    this.ensureManagementAccess(user);

    const current = await this.prisma.configuracionGrupo.findFirst({
      where: { id: 1 },
      select: {
        url_logo: true,
        url_favicon: true,
      },
    });

    const nextLogoPath = files.logo
      ? await this.storeBrandingFile('logo', files.logo)
      : (current?.url_logo ?? null);
    const nextFaviconPath = files.favicon
      ? await this.storeBrandingFile('favicon', files.favicon)
      : (current?.url_favicon ?? null);

    const updated = await this.prisma.configuracionGrupo.upsert({
      where: { id: 1 },
      update: {
        nombre_grupo: dto.nombreGrupo.trim(),
        url_logo: nextLogoPath,
        url_favicon: nextFaviconPath,
        theme_web: dto.themeWeb.trim(),
        theme_mobile: dto.themeMobile.trim(),
      },
      create: {
        id: 1,
        nombre_grupo: dto.nombreGrupo.trim(),
        url_logo: nextLogoPath,
        url_favicon: nextFaviconPath,
        theme_web: dto.themeWeb.trim(),
        theme_mobile: dto.themeMobile.trim(),
      },
      select: {
        nombre_grupo: true,
        url_logo: true,
        url_favicon: true,
        theme_web: true,
        theme_mobile: true,
        updatedAt: true,
      },
    });

    if (
      files.logo &&
      current?.url_logo &&
      current.url_logo !== updated.url_logo
    ) {
      await this.removeStoredFile(current.url_logo);
    }

    if (
      files.favicon &&
      current?.url_favicon &&
      current.url_favicon !== updated.url_favicon
    ) {
      await this.removeStoredFile(current.url_favicon);
    }

    return updated;
  }

  private ensureManagementAccess(user: AuthenticatedUser) {
    const hasAccess = user.scopes.some(
      (scope) =>
        (scope.role === 'ADM' ||
          scope.role === 'DEV' ||
          scope.role === 'JEFATURA') &&
        (scope.scopeType === SCOPE.GRUPO || scope.scopeType === SCOPE.GLOBAL),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'No tenés permisos para administrar la configuración del grupo.',
      );
    }
  }

  private getBrandingStorageDir() {
    return path.resolve(process.cwd(), 'public', 'branding');
  }

  private getFileExtension(file: UploadedBrandingFile) {
    const originalExtension = path
      .extname(file.originalname || '')
      .toLowerCase();

    if (originalExtension) {
      return originalExtension;
    }

    const mimeToExtension: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/x-icon': '.ico',
      'image/vnd.microsoft.icon': '.ico',
    };

    return mimeToExtension[file.mimetype] ?? '';
  }

  private async storeBrandingFile(
    type: 'logo' | 'favicon',
    file: UploadedBrandingFile,
  ) {
    const allowedMimeTypes =
      type === 'logo'
        ? [
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon',
          ]
        : [
            'image/png',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon',
          ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ForbiddenException(
        `El archivo de ${type} debe ser una imagen válida.`,
      );
    }

    const storageDir = this.getBrandingStorageDir();
    await mkdir(storageDir, { recursive: true });

    const extension = this.getFileExtension(file);
    const fileName = `${type}-${Date.now()}${extension}`;
    const absolutePath = path.join(storageDir, fileName);

    await writeFile(absolutePath, file.buffer);

    return `/branding/${fileName}`;
  }

  private async removeStoredFile(filePath: string) {
    const relativePath = filePath.replace(/^\/+/, '');
    const absolutePath = path.resolve(process.cwd(), 'public', relativePath);

    try {
      await unlink(absolutePath);
    } catch {
      return;
    }
  }
}
