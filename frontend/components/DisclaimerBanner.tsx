'use client';

import React from 'react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-[#F2F4F7] border-b border-[#E4E7EC] px-6 py-1 text-[11px] text-[#667085] flex items-center justify-between select-none">
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-[#344054] tracking-wide uppercase text-[10px]">
          DEMO ENVIRONMENT
        </span>
        <span className="text-[#D0D5DD]">|</span>
        <span>
          Synthetic Demonstration Data — For demonstration purposes only. Not official PAIMANA / MoSPI records.
        </span>
      </div>
      <div className="hidden lg:flex items-center space-x-1 text-[#98A2B3] text-[10px]">
        <span>Configurable early warning thresholds (SIH26103)</span>
      </div>
    </div>
  );
}
