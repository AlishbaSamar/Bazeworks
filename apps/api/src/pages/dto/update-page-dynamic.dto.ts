import { IsBoolean, IsString, ValidateIf } from 'class-validator';

export class UpdatePageDynamicDto {
  @IsBoolean()
  isDynamic: boolean;

  // Required when isDynamic is true; ignored (and cleared) when false.
  @ValidateIf((o: UpdatePageDynamicDto) => o.isDynamic)
  @IsString()
  collectionId?: string;

  // The key of the field on that collection whose value forms the URL slug
  // segment, e.g. "slug" for a Blog Posts collection with a Slug field.
  @ValidateIf((o: UpdatePageDynamicDto) => o.isDynamic)
  @IsString()
  slugField?: string;
}
