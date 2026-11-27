'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prepareAssistantAnswer } from '@/lib/assistant-answer';

export function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {prepareAssistantAnswer(content)}
      </ReactMarkdown>
    </div>
  );
}
