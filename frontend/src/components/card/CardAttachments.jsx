import { Download, FileText, Paperclip, Trash2 } from 'lucide-react';
import { cardApi } from '../../api/index.js';
import { useBoardMutation } from '../../hooks/queries.js';
import { formatBytes, timeAgo } from '../../utils/date.js';

const PREVIEWABLE = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

export function CardAttachments({ card, boardId }) {
  const remove = useBoardMutation(boardId, (id) => cardApi.deleteAttachment(card.id, id), { cardId: card.id });
  if (!card.attachments.length) return null;

  return (
    <section className="mb-6" aria-label="Attachments">
      <div className="mb-2 flex items-center gap-3">
        <Paperclip size={20} className="text-slate-600" />
        <h3 className="font-semibold text-slate-700">Attachments</h3>
      </div>
      <ul className="ml-8 space-y-2">
        {card.attachments.map((a) => (
          <li key={a.id} className="flex items-center gap-3" data-testid="attachment">
            <a
              href={cardApi.attachmentUrl(card.id, a.id, PREVIEWABLE.has(a.mimeType))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-200"
            >
              {PREVIEWABLE.has(a.mimeType) ? (
                <img src={cardApi.attachmentUrl(card.id, a.id, true)} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <FileText className="text-slate-500" />
              )}
            </a>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">{a.name}</p>
              <p className="text-xs text-slate-500">
                {formatBytes(a.size)} · added {timeAgo(a.createdAt)}
              </p>
              <div className="mt-1 flex gap-3 text-xs">
                <a href={cardApi.attachmentUrl(card.id, a.id)} className="inline-flex items-center gap-1 text-slate-600 hover:underline">
                  <Download size={12} /> Download
                </a>
                <button type="button" onClick={() => remove.mutate(a.id)} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
