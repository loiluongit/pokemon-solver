export interface TemplateEntry {
  id: number;
  name: string;
  avgR: number;
  avgG: number;
  avgB: number;
}

export const templateCatalog: TemplateEntry[] = [
  { id: 1, name: "cat", avgR: 200, avgG: 140, avgB: 120 },
  { id: 2, name: "dog", avgR: 130, avgG: 165, avgB: 95 },
  { id: 3, name: "frog", avgR: 95, avgG: 150, avgB: 90 },
  { id: 4, name: "fox", avgR: 215, avgG: 120, avgB: 70 },
  { id: 5, name: "owl", avgR: 135, avgG: 130, avgB: 185 },
  { id: 6, name: "pig", avgR: 210, avgG: 130, avgB: 165 },
];
