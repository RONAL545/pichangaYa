import { Body, Controller, Module, Post } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { CreateUserDto } from '../dto';
import { databaseError } from '../database/errors';
@Controller('users')
class UsersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}
  @Post() async create(@Body() dto: CreateUserDto) {
    try { return await this.users.save(this.users.create({ ...dto, email: dto.email.toLowerCase() })); }
    catch (e) { databaseError(e); }
  }
}
@Module({ imports: [TypeOrmModule.forFeature([User])], controllers: [UsersController] })
export class UsersModule {}
