import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

const AvatarContext = React.createContext({});

const Avatar = React.forwardRef(({ className, ...props }, ref) => {
  const [hasImage, setHasImage] = React.useState(false);
  return (
    <AvatarContext.Provider value={{ hasImage, setHasImage }}>
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => {
  const { setHasImage } = React.useContext(AvatarContext);
  React.useEffect(() => {
    if (props.src) {
      const img = new Image();
      img.src = props.src;
      img.onload = () => setHasImage(true);
      img.onerror = () => setHasImage(false);
    } else {
      setHasImage(false);
    }
  }, [props.src, setHasImage]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => {
  const { hasImage } = React.useContext(AvatarContext);
  if (hasImage) return null;
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        className
      )}
      {...props}
    >
      {children || <User className="h-2/3 w-2/3" />}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };