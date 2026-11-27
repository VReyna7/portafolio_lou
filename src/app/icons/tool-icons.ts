/** Small outline icons for tool areas — kept local to avoid a heavy icon pack. */
export type ToolIcon =
  | 'vector'
  | 'image'
  | 'editorial'
  | 'ads'
  | 'video'
  | 'interface'
  | 'social'
  | 'web'
  | 'graphics'
  | 'office';

const AREA_TO_ICON: Record<string, ToolIcon> = {
  'Diseño vectorial': 'vector',
  'Edición de imagen': 'image',
  'Diseño editorial': 'editorial',
  'Publicidad digital': 'ads',
  'Edición de video': 'video',
  'Diseño de interfaces': 'interface',
  'Gestión de redes': 'social',
  'Sitios web': 'web',
  'Piezas gráficas': 'graphics',
  'Productividad y ofimática': 'office'
};

export function iconForArea(area: string): ToolIcon {
  return AREA_TO_ICON[area] ?? 'graphics';
}

export type CategoryIcon = 'brand' | 'media' | 'events' | 'default';

export function iconForCategory(category: string): CategoryIcon {
  const c = category.toLowerCase();
  if (c.includes('marca') || c.includes('brand')) return 'brand';
  if (c.includes('redes') || c.includes('audiovisual') || c.includes('contenido')) return 'media';
  if (c.includes('comunic') || c.includes('evento')) return 'events';
  return 'default';
}
