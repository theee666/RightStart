import { ExternalLink } from 'lucide-react';

// Render public source URLs on the server; never serialize the article body as client props.
export function SourceLinks({ sources }: { sources: string[] }) {
  return (
    <div className="subtitle-links">
      {sources.slice(0, 4).map((s, i) => (
        <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="button outline">
          {i === 0 ? '查看官方来源' : `官方补充来源 ${i}`}
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}
