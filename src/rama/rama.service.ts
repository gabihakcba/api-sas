import { Injectable } from '@nestjs/common';
import { CreateRamaDto } from './dto/create-rama.dto';
import { UpdateRamaDto } from './dto/update-rama.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RamaService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createRamaDto: CreateRamaDto) {
    return 'This action adds a new rama';
  }

  async findAll() {
    const ramas = await this.prismaService.rama.findMany();
    return ramas;
  }

  findOne(id: number) {
    return `This action returns a #${id} rama`;
  }

  update(id: number, updateRamaDto: UpdateRamaDto) {
    return `This action updates a #${id} rama`;
  }

  remove(id: number) {
    return `This action removes a #${id} rama`;
  }
}
