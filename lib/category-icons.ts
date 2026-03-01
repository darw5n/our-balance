import {
  ChefHat,
  ShoppingBasket,
  Bone,
  Stethoscope,
  Package,
  Building2,
  Armchair,
  Wrench,
  Droplets,
  Flame,
  Wifi,
  Lightbulb,
  Trash2,
  TrendingUp,
  Receipt,
  BookOpen,
  GraduationCap,
  HeartPulse,
  Pill,
  Shirt,
  Laptop,
  Palette,
  Popcorn,
  Dumbbell,
  Gift,
  Fuel,
  Car,
  ParkingCircle,
  Compass,
  BedDouble,
  Plane,
  Briefcase,
  Banknote,
  Tag,
  type LucideIcon,
} from "lucide-react"

export type { LucideIcon }

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Alimentari
  "Ristoranti & Asporto": ChefHat,
  "Spesa supermercato": ShoppingBasket,
  // Animali
  "Cibo & Accessori": Bone,
  "Veterinario": Stethoscope,
  // Altro
  "Spese varie": Package,
  // Casa
  "Affitto / Mutuo": Building2,
  "Arredamento": Armchair,
  "Manutenzione": Wrench,
  // Utenze
  "Acqua": Droplets,
  "Gas": Flame,
  "Internet": Wifi,
  "Luce": Lightbulb,
  "Rifiuti": Trash2,
  // Finanza
  "Investimenti": TrendingUp,
  "Tasse & Imposte": Receipt,
  // Formazione
  "Corsi & Libri": BookOpen,
  "Scuola & Università": GraduationCap,
  // Salute
  "Dentista": HeartPulse,
  "Farmaci": Pill,
  "Visite mediche": Stethoscope,
  // Shopping
  "Abbigliamento": Shirt,
  "Tecnologia": Laptop,
  // Svago
  "Hobby": Palette,
  "Intrattenimento": Popcorn,
  "Palestra & Sport": Dumbbell,
  "Regali": Gift,
  // Trasporti
  "Carburante": Fuel,
  "Manutenzione auto": Car,
  "Parcheggio & Pedaggi": ParkingCircle,
  // Viaggi
  "Attività & Escursioni": Compass,
  "Hotel & Alloggio": BedDouble,
  "Voli & Treni": Plane,
  // Entrate
  "Freelance & Extra": Briefcase,
  "Stipendio": Banknote,
}

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Tag
}
