import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

extend([a11yPlugin]);

export const getContrastHexColor = (hexColor?: string | null) => {
  if (!hexColor) return { color: undefined, contrast: undefined };
  const color = colord(hexColor);
  const contrast = color.isLight() ? '#000000' : '#FFFFFF';
  return { color: color.toHex(), contrast };
};
