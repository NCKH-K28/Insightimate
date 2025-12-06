import Image from 'next/image';

type ImageProps = React.ComponentProps<typeof Image>;
type LogoImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  width?: number;
  height?: number;
  alt?: string;
};

export function InsightmateLogoFull({ alt, width, height, priority, ...rest }: LogoImageProps) {
  return (
    <Image
      src='/logos/crop/insightmate-logo-full.png'
      alt={alt ?? 'Insightmate Logo Full'}
      width={width ?? 150}
      height={height ?? 40}
      priority={priority ?? true}
      {...rest}
    />
  );
}

export function InsightmateLogoIcon({ alt, width, height, priority, ...rest }: LogoImageProps) {
  return (
    <Image
      src='/logos/crop/insightmate-logo-icon.png'
      alt={alt ?? 'Insightmate Logo Icon'}
      width={width ?? 40}
      height={height ?? 40}
      priority={priority ?? true}
      {...rest}
    />
  );
}

export function InsightmateLogoWordmark({ alt, width, height, priority, ...rest }: LogoImageProps) {
  return (
    <Image
      src='/logos/crop/insightmate-logo-wordmark.png'
      alt={alt ?? 'Insightmate Logo Wordmark'}
      width={width ?? 120}
      height={height ?? 40}
      priority={priority ?? true}
      {...rest}
    />
  );
}
