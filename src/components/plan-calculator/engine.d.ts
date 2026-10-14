export interface PlanLead {
  nombre: string;
  inmobiliaria: string;
  email: string;
  telefono: string;
  zona: string;
  /** Rango elegido en el formulario: "1-2", "3-5", "6-10" o "+10". */
  empleados: string;
  /** Resumen en texto del plan elegido y la estimación, para el CRM. */
  summary: string;
}

export interface PlanCalculatorOptions {
  /** Envía el lead; debe resolver a true si se registró bien. */
  onLead: (lead: PlanLead) => Promise<boolean>;
}

/** Monta la calculadora sobre `root` (que ya contiene PLAN_MARKUP) y devuelve la función de limpieza. */
export function mountPlanCalculator(root: HTMLElement, opts: PlanCalculatorOptions): () => void;
