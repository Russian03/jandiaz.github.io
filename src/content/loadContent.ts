import { z } from 'zod';
import { parse } from 'yaml';
import en from '../../content/en.md?raw';
import es from '../../content/es.md?raw';

export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];

const LinkSchema = z.object({
  type: z.enum(['github', 'email', 'linkedin', 'instagram', 'cv']),
  label: z.string().min(1),
  url: z.string().min(1),
});

const FrontMatterSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  handle: z.string().min(1),
  handleUrl: z.url(),
  title: z.string().min(1),
  description: z.string().min(1),
  hint: z.string().min(1),
  aboutLabel: z.string().min(1),
  links: z.array(LinkSchema).min(1),
});

export type Content = z.infer<typeof FrontMatterSchema> & { about: string };

/** Splits `---` YAML front matter from the Markdown body and validates it. */
export function parseContent(raw: string): Content {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error('Content file must start with YAML front matter (--- ... ---)');
  const data = FrontMatterSchema.parse(parse(match[1]));
  return { ...data, about: match[2].trim() };
}

export const CONTENT: Record<Lang, Content> = { en: parseContent(en), es: parseContent(es) };
