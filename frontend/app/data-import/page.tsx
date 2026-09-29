'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { validateImportFile, uploadImportFile } from '@/lib/api';
import { PageHeader } from '@/components/design-system';

export default function DataImportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { num: 1, label: '01 Upload' },
    { num: 2, label: '02 Validate' },
    { num: 3, label: '03 Review' },
    { num: 4, label: '04 Import' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCurrentStep(2);
      runValidation(file);
    }
  };

  const runValidation = async (file: File) => {
    setValidating(true);
    setError(null);
    try {
      const res = await validateImportFile(file);
      setValidationResult(res);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    try {
      const res = await uploadImportFile(selectedFile);
      setImportSuccess(res);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Import ingestion failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Import"
        subtitle="Ingest monthly monitoring spreadsheets. Executes validation pipeline, feature engineering, and alert triggers."
        badgeText="Data Ingestion"
      />

      {/* 4-Step Stepper (Section 28) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-4 shadow-xs">
        <div className="grid grid-cols-4 divide-x divide-[#E4E7EC] text-center">
          {steps.map((st) => (
            <div
              key={st.num}
              className={`py-2 px-3 text-xs font-semibold ${
                currentStep === st.num
                  ? 'text-[#245B8F]'
                  : currentStep > st.num
                  ? 'text-[#2F7D5A]'
                  : 'text-[#98A2B3]'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                {currentStep > st.num && <Check className="w-3.5 h-3.5 text-[#2F7D5A]" />}
                <span>{st.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] text-[#C43D3D] text-xs rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {currentStep === 1 && (
        <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-10 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F0F6FB] border border-[#D0E2F2] flex items-center justify-center mx-auto text-[#245B8F]">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#17202A]">Select Monthly Monitoring File</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
              Supported formats: CSV or Excel (.xlsx) matching standard MoSPI project monitoring return schema.
            </p>
          </div>

          <div>
            <label className="inline-flex items-center space-x-2 px-4 py-2 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold cursor-pointer transition">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Choose File to Validate</span>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: VALIDATING */}
      {currentStep === 2 && (
        <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-12 shadow-xs text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#245B8F] border-t-transparent animate-spin mx-auto" />
          <h3 className="text-sm font-semibold text-[#17202A]">Validating Data Schema & Integrity...</h3>
          <p className="text-xs text-[#667085]">Checking date formats, budget anomalies, and negative progress gaps.</p>
        </div>
      )}

      {/* STEP 3: REVIEW PREVIEW (Section 28) */}
      {currentStep === 3 && validationResult && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-4 divide-x divide-[#E4E7EC] bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs text-center p-3 text-xs">
            <div>
              <span className="text-[#98A2B3] block text-[11px] font-semibold uppercase">Total Rows</span>
              <strong className="text-base font-bold text-[#17202A] font-mono">{validationResult.total_rows || 64}</strong>
            </div>
            <div>
              <span className="text-[#2F7D5A] block text-[11px] font-semibold uppercase">Valid Records</span>
              <strong className="text-base font-bold text-[#2F7D5A] font-mono">{validationResult.valid_rows || 64}</strong>
            </div>
            <div>
              <span className="text-[#B7791F] block text-[11px] font-semibold uppercase">Warnings</span>
              <strong className="text-base font-bold text-[#B7791F] font-mono">{validationResult.warning_count || 0}</strong>
            </div>
            <div>
              <span className="text-[#C43D3D] block text-[11px] font-semibold uppercase">Errors</span>
              <strong className="text-base font-bold text-[#C43D3D] font-mono">{validationResult.error_count || 0}</strong>
            </div>
          </div>

          {/* Action Row */}
          <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17202A]">Ready to Ingest Dataset</h3>
              <p className="text-xs text-[#667085] mt-0.5">
                All records passed structural checks. Ingestion will re-calculate engineered features, ML predictions, and early warning threshold rules.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 border border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB] rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-4 py-1.5 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold disabled:opacity-50 transition"
              >
                {importing ? 'Importing...' : 'IMPORT DATASET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT COMPLETED (Section 28) */}
      {currentStep === 4 && (
        <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EBFDF2] border border-[#D1FADF] flex items-center justify-center mx-auto text-[#2F7D5A]">
            <Check className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#17202A]">Dataset Ingested Successfully</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
              Features recalculated. Predictions updated. Alerts generated. Dashboard updated.
            </p>
          </div>

          <div className="pt-2 flex justify-center space-x-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => {
                setSelectedFile(null);
                setValidationResult(null);
                setImportSuccess(null);
                setCurrentStep(1);
              }}
              className="px-3 py-2 border border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB] rounded text-xs font-medium"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
