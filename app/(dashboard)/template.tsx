// Il template si rimonta a ogni cambio di pagina (il layout no): così la
// pagina nuova, e prima ancora il suo skeleton, entrano con la dissolvenza di `.route-fade`.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-fade">{children}</div>
}
