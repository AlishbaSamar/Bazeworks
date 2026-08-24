import { Type } from 'class-transformer';
import { IsHexColor, IsIn, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Roboto',
  'Montserrat',
] as const;

const FONT_WEIGHTS = ['400', '500', '600', '700', '800'] as const;

const SPACING_SCALES = ['compact', 'comfortable', 'spacious'] as const;

class ThemeColorsDto {
  @IsHexColor()
  primary: string;

  @IsHexColor()
  secondary: string;

  @IsHexColor()
  background: string;

  @IsHexColor()
  text: string;

  @IsHexColor()
  accent: string;

  @IsHexColor()
  border: string;
}

class ThemeTypographyDto {
  @IsString()
  @IsIn(FONT_OPTIONS)
  headingFont: string;

  @IsString()
  @IsIn(FONT_OPTIONS)
  bodyFont: string;

  @IsInt()
  @Min(12)
  @Max(24)
  baseFontSize: number;

  @IsString()
  @IsIn(FONT_WEIGHTS)
  headingWeight: string;

  @IsString()
  @IsIn(FONT_WEIGHTS)
  bodyWeight: string;
}

class ThemeLayoutDto {
  @IsInt()
  @Min(640)
  @Max(1600)
  containerWidth: number;

  @IsInt()
  @Min(0)
  @Max(32)
  borderRadius: number;

  @IsString()
  @IsIn(SPACING_SCALES)
  spacingScale: string;
}

export class UpdateThemeDto {
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  colors: ThemeColorsDto;

  @ValidateNested()
  @Type(() => ThemeTypographyDto)
  typography: ThemeTypographyDto;

  @ValidateNested()
  @Type(() => ThemeLayoutDto)
  layout: ThemeLayoutDto;
}
