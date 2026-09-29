'use client';

import React, { useState, useEffect } from 'react';
import { Play, Check, CheckCircle2, Info } from 'lucide-react';
import { getModelEvaluation, trainModels } from '@/lib/api';
import { PageHeader } from '@/components/design-system';

export default function ModelEvaluationPage() {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainSuccess, setTrainSuccess] = useState<string | null>(null);

  const fetchEvaluation = () => {
    setLoading(true);
    getModelEvaluation()
      .then((data) => setEvaluation(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const handleTrainModels = async () => {
    setTraining(true);
    setTrainSuccess(null);
    try {
      const res = await trainModels();
      setTrainSuccess(`Model pipeline execution completed. Evaluated across ${res.training_samples} demonstration snapshots.`);
      fetchEvaluation();
    } catch (err: any) {
      alert(err.message || 'Model training run failed');
    } finally {
      setTraining(false);
    }
  };

  const modelsList = evaluation?.models || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Evaluation"
        subtitle="Empirical performance metrics and statistical comparison between baseline heuristics and machine-learning models."
        badgeText="Model Governance"
        actions={
          <button
            onClick={handleTrainModels}
            disabled={training}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#245B8F] hover:bg-[#1D4D79] text-white rounded text-xs font-semibold transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? 'Evaluating Pipeline...' : 'Run Pipeline Retraining'}</span>
          </button>
        }
      />

      {trainSuccess && (
        <div className="p-3 bg-[#EBFDF2] border border-[#D1FADF] text-[#2F7D5A] text-xs rounded flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{trainSuccess}</span>
        </div>
      )}

      {/* Model Performance Comparison Table (Section 27) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] bg-[#FAFBFC] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17202A]">Comparative Model Performance</h2>
          <span className="text-xs text-[#667085]">Chronological 70/30 Split · Anti-Leakage Protocol</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FFFFFF] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-3 text-right">Precision</th>
                <th className="py-3 px-3 text-right">Recall</th>
                <th className="py-3 px-3 text-right">F1 Score</th>
                <th className="py-3 px-3 text-right">PR-AUC</th>
                <th className="py-3 px-3 text-right">MAE</th>
                <th className="py-3 px-4 text-right">RMSE</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#98A2B3] font-mono text-xs">
                    Loading model evaluation metrics...
                  </td>
                </tr>
              ) : (
                modelsList.map((m: any) => (
                  <tr key={m.model_name} className="hover:bg-[#F9FAFB] transition">
                    <td className="py-3 px-4 font-semibold text-[#17202A]">{m.model_name}</td>
                    <td className="py-3 px-4 text-[#667085]">{m.model_type}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#17202A]">{m.precision.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#17202A]">{m.recall.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#245B8F] tabular-nums">{m.f1_score.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#17202A]">{m.pr_auc.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#17202A]">{m.mae.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#17202A]">{m.rmse.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EBFDF2] text-[#2F7D5A] border border-[#D1FADF]">
                        {m.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Metadata Box (Section 27) */}
      <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-md p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
          Model Governance & Validation Metadata
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[#98A2B3] block text-[11px]">Dataset Version</span>
            <strong className="text-[#17202A] font-mono">{evaluation?.dataset_version || 'demo-synthetic-v1.2'}</strong>
          </div>
          <div>
            <span className="text-[#98A2B3] block text-[11px]">Training Period</span>
            <strong className="text-[#17202A] font-mono">2023-01 to 2023-09</strong>
          </div>
          <div>
            <span className="text-[#98A2B3] block text-[11px]">Test Period</span>
            <strong className="text-[#17202A] font-mono">2023-10 to 2024-04</strong>
          </div>
          <div>
            <span className="text-[#98A2B3] block text-[11px]">Feature Count</span>
            <strong className="text-[#17202A] font-mono">18 engineered features</strong>
          </div>
          <div>
            <span className="text-[#98A2B3] block text-[11px]">Active Model</span>
            <strong className="text-[#245B8F] font-mono">XGBoost / Gradient Boosting</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
