import Image from 'next/image';

type ImageProps = React.ComponentProps<typeof Image>;
type GoogleIconProps = Omit<ImageProps, 'src'> & { width?: number; height?: number; alt?: string };

export function GoogleIcon({ alt, width, height, priority, ...rest }: GoogleIconProps) {
  return (
    <Image
      {...rest}
      src='/icons/svgrepo/google-icon.svg'
      alt={alt || 'Google Icon'}
      width={width || 20}
      height={height || 20}
      priority={priority}
    />
  );
}
