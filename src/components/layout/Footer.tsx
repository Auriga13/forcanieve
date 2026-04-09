import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Fuentes de datos</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>AEMET OpenData</li>
              <li>Open-Meteo (ECMWF)</li>
              <li>Meteo-France BRA</li>
              <li>A Lurte</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Legal</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link href="/privacidad" className="hover:underline">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Aviso</h3>
            <p className="text-muted-foreground text-xs">
              Los datos y resúmenes de IA son orientativos. Consulta siempre las
              fuentes oficiales y toma decisiones responsables antes de realizar
              actividades de montaña.
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-center text-muted-foreground">
          ForcaNieve &mdash; Pirineo Aragonés
        </p>
      </div>
    </footer>
  );
}
