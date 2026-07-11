import type { ReactNode } from 'react';

/** Shared page frame: one max-width + centering for every route. */
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>;
}
