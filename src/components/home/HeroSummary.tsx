import { AiDisclaimer } from "@/components/shared/AiDisclaimer";
import { LastUpdated } from "@/components/shared/LastUpdated";

interface HeroSummaryProps {
  summary: string | null;
  updatedAt: string | null;
  imageUrl?: string;
}

export function HeroSummary({ summary, updatedAt, imageUrl }: HeroSummaryProps) {
  return (
    <section
      className="relative w-full min-h-[400px] flex items-end bg-cover bg-center"
      style={{
        backgroundImage: imageUrl
          ? `url(${imageUrl})`
          : "linear-gradient(135deg, #1e3a5f 0%, #4a90d9 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative container mx-auto px-4 py-10">
        <div className="max-w-2xl backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Hoy en el Pirineo Aragonés
          </h1>
          {summary ? (
            <p className="text-white/90 leading-relaxed">{summary}</p>
          ) : (
            <p className="text-white/60 italic">
              Resumen no disponible. Los datos se actualizan cada 6 horas.
            </p>
          )}
          <div className="mt-3 flex items-center gap-4">
            <LastUpdated date={updatedAt} />
          </div>
          <AiDisclaimer />
        </div>
      </div>
    </section>
  );
}
