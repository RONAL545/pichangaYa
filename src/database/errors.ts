import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
export function databaseError(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const code = (error.driverError as { code?: string }).code;
    if (code === '23P01') throw new ConflictException('La cancha ya tiene una reserva en ese horario');
    if (code === '23505') throw new ConflictException('El registro ya existe');
    if (code === '23503') throw new NotFoundException('El usuario, cancha o complejo no existe');
  }
  throw error;
}
