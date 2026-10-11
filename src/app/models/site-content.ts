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
  /** CSS aspect ratio of the clip, e.g. "9 / 16" for reels (default 3 / 4). */
  ratio?: string;
  /** True when the file keeps its audio track; shows a sound toggle (clips always start muted). */
  sound?: boolean;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover: string;
  role: string;
  /** Optional list of responsibilities shown under "Mi rol". */
  tasks?: string[];
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
  /** Public profile URL; empty hides the link. */
  linkedin: string;
  whatsapp: string;
  web3formsKey: string;
  services: string[];
}

export interface Certification {
  title: string;
  issuer: string;
  year?: string;
  /** Scan or photo of the diploma; empty renders a styled paper mock-up. */
  image: string;
}

export interface CertificationsSection {
  title: string;
  description: string;
  items: Certification[];
}

export interface SiteContent {
  profile: Profile;
  tools: ToolsSection;
  projects: Project[];
  contact: ContactSection;
  /** Optional closing section; hidden when missing or empty. */
  certifications?: CertificationsSection;
}
