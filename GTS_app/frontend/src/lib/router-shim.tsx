'use client';

import React, { forwardRef } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname: pathname || '/', search: '', hash: '', state: null, key: 'default' };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useNextParams() as unknown as T;
}

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string;
  href?: string;
  replace?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, replace, children, ...rest }, ref) => {
    return (
      <NextLink ref={ref} href={to || href || '#'} replace={replace} {...rest}>
        {children}
      </NextLink>
    );
  }
);
Link.displayName = 'Link';
