import { Type } from 'class-transformer';
import { IsEmail, IsISO8601, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
export class CreateUserDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
}
export class CreateVenueDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(300) address!: string;
  @IsLatitude() @IsNumber() latitude!: number;
  @IsLongitude() @IsNumber() longitude!: number;
}
export class CreateCourtDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsUUID() venueId!: string;
}
export class IntervalDto {
  @IsISO8601({ strict: true }) startsAt!: string;
  @IsISO8601({ strict: true }) endsAt!: string;
}
export class CreateBookingDto extends IntervalDto {
  @IsUUID() courtId!: string;
  @IsUUID() userId!: string;
}
export class NearbyDto {
  @Type(() => Number) @IsLatitude() @IsNumber() latitude!: number;
  @Type(() => Number) @IsLongitude() @IsNumber() longitude!: number;
  @Type(() => Number) @IsNumber() @Min(1) @Max(100000) radiusMeters!: number;
}
