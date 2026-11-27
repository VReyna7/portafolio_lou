/** Small typed readers for form events, so templates stay free of casts. */
export function valueOf(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
}

export function checkedOf(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}
