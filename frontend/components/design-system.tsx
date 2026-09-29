'use client';

import React from 'react';
import Link from 'next/link';

// Restrained Color Palette:
// LOW: #2F7D5A, MODERATE: #B7791F, HIGH: #C65D32, CRITICAL: #C43D3D
export function RiskBadge({
  band,
  score,
  compact = false,
}: {
  band: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  score?: number;
  compact?: boolean;
}) {
  const normalizedBand = band?.toUpperCase() || 'LOW';

  const styles: Record<string, { bg: string; text: string; border: string }> = {
    LOW: {
      bg: 'bg-[#EBFDF2]',
      text: 'text-[#2F7D5A]',
      border: 'border-[#D1FADF]',
    },
    MODERATE: {
      bg: 'bg-[#FEF9EE]',
      text: 'text-[#B7791F]',
      border: 'border-[#FCE4A6]',
    },
    HIGH: {
      bg: 'bg-[#FDF4ED]',
      text: 'text-[#C65D32]',
      border: 'border-[#F9D6B8]',
    },
    CRITICAL: {
      bg: 'bg-[#FEF3F2]',
      text: 'text-[#C43D3D]',
      border: 'border-[#FECDCA]',
    },
  };

  const style = styles[normalizedBand] || styles.LOW;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      <span className="font-semibold">{normalizedBand}</span>
      {score !== undefined && (
        <>
          <span className="opacity-50">·</span>
          <span className="tabular-nums font-mono font-semibold">{Math.round(score)}</span>
        </>
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'bg-[#FEF3F2]', text: 'text-[#C43D3D]', border: 'border-[#FECDCA]' },
    Delayed: { bg: 'bg-[#FEF9EE]', text: 'text-[#B7791F]', border: 'border-[#FCE4A6]' },
    Ongoing: { bg: 'bg-[#F2F4F7]', text: 'text-[#344054]', border: 'border-[#EAECF0]' },
    Completed: { bg: 'bg-[#EBFDF2]', text: 'text-[#2F7D5A]', border: 'border-[#D1FADF]' },
  };

  const style = styles[status] || styles.Ongoing;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      {status}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  badgeText,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badgeText?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E4E7EC]">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl sm:text-2xl font-bold text-[#17202A] tracking-tight">
            {title}
          </h1>
          {badgeText && (
            <span className="px-2 py-0.5 bg-[#F0F6FB] text-[#245B8F] border border-[#D0E2F2] rounded text-[10px] font-semibold tracking-wide uppercase">
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-[#667085] mt-1 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

// Single Horizontal Metric Section with subtle vertical dividers (Section 14)
export function MetricStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7EC] mb-6 shadow-xs">
      {children}
    </div>
  );
}

export function MetricItem({
  label,
  value,
  secondary,
  tone,
  href,
}: {
  label: string;
  value: string | number;
  secondary?: string;
  tone?: 'default' | 'highRisk' | 'critical' | 'success';
  href?: string;
}) {
  const toneColors: Record<string, string> = {
    default: 'text-[#17202A]',
    highRisk: 'text-[#C65D32]',
    critical: 'text-[#C43D3D]',
    success: 'text-[#2F7D5A]',
  };

  const content = (
    <div className="p-4 sm:p-5 flex flex-col justify-between hover:bg-[#F9FAFB] transition">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
        {label}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 tabular-nums ${toneColors[tone || 'default']}`}>
        {value}
      </div>
      {secondary && (
        <div className="text-[11px] text-[#98A2B3] mt-1 line-clamp-1">
          {secondary}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block group">{content}</Link>;
  }

  return content;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-10 text-center bg-[#FFFFFF] border border-[#E4E7EC] rounded-md my-4">
      <h3 className="text-sm font-semibold text-[#17202A]">{title}</h3>
      <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
