import type { FormHTMLAttributes, ReactNode } from 'react';

const surface =
  'rounded-card bg-paper px-7 pt-[30px] pb-7 text-ink shadow-card';

// The ivory registration card every auth page sits on. Rendered as a <form>
// when there is something to submit, a <div> otherwise.
export function Card({ children }: { children: ReactNode }) {
  return <div className={surface}>{children}</div>;
}

export function CardForm({
  children,
  ...rest
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={surface} noValidate {...rest}>
      {children}
    </form>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-[5px] font-serif text-[31px] leading-[1.15] font-normal tracking-[0.005em]">
      {children}
    </h1>
  );
}

// The "already have an account?" line under the title.
export function CardSwitch({ children }: { children: ReactNode }) {
  return <p className="mb-[22px] text-[13.5px] text-graphite">{children}</p>;
}
