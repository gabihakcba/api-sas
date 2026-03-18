import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { UpdateConfiguracionGrupoDto } from './dto/update-configuracion-grupo.dto';
import { PublicConfigService } from './public-config.service';

interface UploadedBrandingFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller()
export class PublicConfigController {
  constructor(private readonly publicConfigService: PublicConfigService) {}

  @Get('public/configuracion-grupo')
  async getConfiguracionGrupo() {
    return this.publicConfigService.getConfiguracionGrupo();
  }

  @Get('configuracion-grupo')
  @UseGuards(JwtAuthGuard)
  async getManagedConfiguracionGrupo(@Req() req: AuthenticatedRequest) {
    return this.publicConfigService.getManagedConfiguracionGrupo(req.user!);
  }

  @Patch('configuracion-grupo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  async updateConfiguracionGrupo(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateConfiguracionGrupoDto,
    @UploadedFiles()
    files: {
      logo?: UploadedBrandingFile[];
      favicon?: UploadedBrandingFile[];
    },
  ) {
    return this.publicConfigService.updateConfiguracionGrupo(req.user!, dto, {
      logo: files.logo?.[0],
      favicon: files.favicon?.[0],
    });
  }
}
