import type { ReactNode } from "react";

type RouteHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function RouteHero({ eyebrow, title, description, actions }: RouteHeroProps) {
  return (
    <header className="react-route-hero">
      <div className="react-route-hero-copy">
        <p className="react-route-hero-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="react-route-hero-description">{description}</p>
      </div>
      {actions && <div className="react-route-hero-actions">{actions}</div>}
    </header>
  );
}
