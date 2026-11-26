import type { ComponentType } from 'react';
import { FaGithub, FaLinkedinIn, FaInstagram, FaEnvelope } from 'react-icons/fa6';
import type { Content } from '../content/loadContent';

function CvIcon() {
  return (
    <span className="cv-badge" aria-hidden>
      CV
    </span>
  );
}

type LinkType = Content['links'][number]['type'];

const ICONS: Record<LinkType, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  github: FaGithub,
  email: FaEnvelope,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  cv: CvIcon,
};

export function ProfileLinks({ links }: { links: Content['links'] }) {
  return (
    <nav className="links" aria-label="Links">
      {links.map(({ type, label, url }) => {
        const Icon = ICONS[type];
        const external = /^https?:/.test(url);
        return (
          <a
            key={type}
            className={`link-${type}`}
            href={url.startsWith('/') ? import.meta.env.BASE_URL + url.slice(1) : url}
            aria-label={label}
            title={label}
            {...(external || type === 'cv' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Icon aria-hidden />
          </a>
        );
      })}
    </nav>
  );
}
