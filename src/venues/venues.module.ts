import { Body, Controller, Module, Post } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from '../entities';
import { CreateVenueDto } from '../dto';
@Controller('venues')
class VenuesController {
  constructor(@InjectRepository(Venue) private readonly venues: Repository<Venue>) {}
  @Post() create(@Body() dto: CreateVenueDto) {
    return this.venues.save(this.venues.create({ name: dto.name, address: dto.address,
      location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] } }));
  }
}
@Module({ imports: [TypeOrmModule.forFeature([Venue])], controllers: [VenuesController] })
export class VenuesModule {}
