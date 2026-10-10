export interface Profile {
  name: string;
  headline: string;
  photo: string;
  intro: string[];
  quote: string;
}

export interface Tool {
  name: string;
  short: string;
  area: string;
}

export interface ToolsSection {
  title: string;
  description: string;
  items: Tool[];
}

export interface Evidence {
  title: string;
  description: string;
  image: string;
  /** Optional muted, looping clip; takes precedence over `image`. */
  video?: string;
  /** Still frame shown before the video loads. */
  poster?: string;
  /** Playback speed for the video (1 = normal). */
  speed?: number;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover: string;
  role: string;
  description: string;
  driveUrl: string;
  accent: string;
  evidence: Evidence[];
}

export interface ContactSection {
  title: string;
  description: string;
  photo: string;
  email: string;
  whatsapp: string;
  web3formsKey: string;
  services: string[];
}

export interface SiteContent {
  profile: Profile;
  tools: ToolsSection;
  projects: Project[];
  contact: ContactSection;
}
