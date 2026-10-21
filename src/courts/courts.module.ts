import { Body, Controller, Get, Module, Post, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Court } from '../entities';
import { CreateCourtDto, NearbyDto } from '../dto';
import { databaseError } from '../database/errors';
@Controller('courts')
class CourtsController {
  constructor(@InjectRepository(Court) private readonly courts: Repository<Court>) {}
  @Post() async create(@Body() dto: CreateCourtDto) {
    try { return await this.courts.save(this.courts.create(dto)); } catch (e) { databaseError(e); }
  }
  @Get('nearby') nearby(@Query() dto: NearbyDto) {
    return this.courts.query(`SELECT c.id, c.name, c.venue_id AS "venueId", v.name AS "venueName",
      ST_Distance(v.location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS "distanceMeters"
      FROM courts c JOIN venues v ON v.id=c.venue_id
      WHERE ST_DWithin(v.location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
      ORDER BY "distanceMeters", c.id LIMIT 100`, [dto.longitude, dto.latitude, dto.radiusMeters]);
  }
}
@Module({ imports: [TypeOrmModule.forFeature([Court])], controllers: [CourtsController] })
export class CourtsModule {}
