import { AiDisclaimer } from "@/components/shared/AiDisclaimer";
import { LastUpdated } from "@/components/shared/LastUpdated";

interface ZoneHeaderProps {
  name: string;
  imageUrl: string | null;
  summary: string | null;
  updatedAt: string | null;
}

export function ZoneHeader({ name, imageUrl, summary, updatedAt }: ZoneHeaderProps) {
  return (
    <section
      className="relative w-full min-h-[300px] flex items-end bg-cover bg-center"
      style={{
        backgroundImage: imageUrl
          ? `url(${imageUrl})`
          : "linear-gradient(135deg, #1e3a5f 0%, #4a90d9 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{name}</h1>
        {summary && (
          <div className="max-w-2xl backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-white/90 text-sm leading-relaxed">{summary}</p>
            <LastUpdated date={updatedAt} />
            <AiDisclaimer />
          </div>
        )}
      </div>
    </section>
  );
}
