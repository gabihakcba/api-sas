import { PartialType } from '@nestjs/mapped-types';
import { CreateProtagonistaDto } from './create-protagonista.dto';

export class UpdateProtagonistaDto extends PartialType(CreateProtagonistaDto) {}
