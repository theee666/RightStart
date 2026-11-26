'use client';
import { useState } from 'react';
import {
  BriefcaseBusiness,
  FileCheck2,
  Calculator,
  ClipboardCheck,
  Sparkles,
  ShieldCheck,
  MessagesSquare,
  BookOpen,
  MapPin,
  Copy,
  Check,
  type LucideIcon,
} from 'lucide-react';
export const icons: Record<string, LucideIcon> = {
  offer: BriefcaseBusiness,
  contract: FileCheck2,
  insurance: Calculator,
  checklist: ClipboardCheck,
  ai: Sparkles,
  interview: MessagesSquare,
  knowledge: BookOpen,
  subsidy: MapPin,
};
export function ToolIcon({
  name,
  color = 'blue',
  small = false,
}: {
  name: string;
  color?: string;
  small?: boolean;
}) {
  const Icon = icons[name] || BookOpen;
  return (
    <span className={`tool-icon ${color} ${small ? 'small' : ''}`}>
      <Icon size={small ? 20 : 26} strokeWidth={1.7} />
    </span>
  );
}
export function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <button
      type="button"
      className="text-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setError(false);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setError(true);
        }
      }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
      {error ? '复制失败，请手动选择' : copied ? '已复制' : label}
    </button>
  );
}
export function PrivacyNote() {
  return (
    <div className="privacy-note">
      <ShieldCheck size={18} />
      <span>
        请先隐去姓名、证件号码、电话及公司敏感信息。工具结果仅供核对参考，不构成法律意见。
      </span>
    </div>
  );
}
