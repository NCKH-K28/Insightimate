import Image from 'next/image';

type ImageProps = React.ComponentProps<typeof Image>;
type FacebookIconProps = Omit<ImageProps, 'src'> & {
  width?: number;
  height?: number;
  alt?: string;
};

export const FacebookIcon = ({ alt, width, height, priority, ...rest }: FacebookIconProps) => {
  return (
    <Image
      {...rest}
      src='/icons/svgrepo/facebook-icon.svg'
      alt={alt || 'Facebook Icon'}
      width={width || 20}
      height={height || 20}
      priority={priority}
    />
  );
};

// import Image from 'next/image';

// export function GoogleIcon({
//   alt,
//   width,
//   height,
//   priority,
//   ...rest
// }: React.ComponentProps<typeof Image>) {
//   return (
//     <Image
//       {...rest}
//       src='/icons/svgrepo/google-icon.svg'
//       alt={alt || 'Google Icon'}
//       width={width || 20}
//       height={height || 20}
//       priority={priority}
//     />
//   );
// }
