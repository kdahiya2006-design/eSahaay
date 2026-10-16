import React, { useState } from 'react';
import type { IncidentAnalysis, HumanReviewUpdate, UrgencyLevel } from '../types';
import { X, UserCheck, Save } from 'lucide-react';
import { UrgencyBadge } from './UrgencyBadge';

interface HumanReviewModalProps {
  analysis: IncidentAnalysis;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (review: HumanReviewUpdate) => Promise<void>;
  existingReview?: HumanReviewUpdate | null;
}

export const HumanReviewModal: React.FC<HumanReviewModalProps> = ({
  analysis,
  isOpen,
  onClose,
  onSaveReview,
  existingReview,
}) => {
  const [urgency, setUrgency] = useState<UrgencyLevel>(
    existingReview?.reviewed_urgency || analysis.provisional_urgency
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    existingReview?.urgency_override_reason || ''
  );
  const [categories, setCategories] = useState<string[]>(
    existingReview?.reviewed_categories || [...analysis.incident_categories]
  );
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [notes, setNotes] = useState<string>(
    existingReview?.operator_notes || ''
  );
  const [verificationStatus, setVerificationStatus] = useState<
    'Verified' | 'Unverified' | 'Needs Investigation' | 'Disputed'
  >(existingReview?.verification_status || 'Verified');
  const [reviewStatus, setReviewStatus] = useState<
    'Pending Review' | 'Reviewed & Verified' | 'Escalated to Supervisor' | 'Closed'
  >(existingReview?.review_status || 'Reviewed & Verified');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (newCategoryInput.trim() && !categories.includes(newCategoryInput.trim())) {
      setCategories([...categories, newCategoryInput.trim()]);
      setNewCategoryInput('');
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter((c) => c !== catToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveReview({
        case_id: analysis.case_id,
        reviewed_urgency: urgency,
        urgency_override_reason: urgency !== analysis.provisional_urgency ? overrideReason : undefined,
        reviewed_categories: categories,
        operator_notes: notes,
        verification_status: verificationStatus,
        review_status: reviewStatus,
        reviewer_id: 'Operator-OP412',
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save review. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-teal-500 rounded-lg text-white shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-none truncate">
                Human Operator Review & Verification
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 truncate">
                Case ID: <span className="font-mono font-bold text-teal-300">{analysis.case_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs sm:text-sm">
          {/* AI vs Human Urgency Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Provisional AI Urgency:
              </span>
              <UrgencyBadge urgency={analysis.provisional_urgency} />
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Operator Confirmed Urgency:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['High', 'Medium', 'Low', 'Unable to Determine'] as UrgencyLevel[]).map(
                  (lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setUrgency(lvl)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                        urgency === lvl
                          ? lvl === 'High'
                            ? 'bg-red-600 text-white border-red-700 shadow-xs'
                            : lvl === 'Medium'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : lvl === 'Low'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-700 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  )
                )}
              </div>
            </div>

            {urgency !== analysis.provisional_urgency && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-amber-900 mb-1">
                  Reason for Overriding AI Assessment:
                </label>
                <input
                  type="text"
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Caller confirmed distance closed to under 5 meters in dark area"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-amber-50/50 focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Incident Categories */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Incident Categories (Confirm or Modify)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="hover:text-red-600 text-teal-600 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Add custom category..."
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
              >
                Add
              </button>
            </div>
          </div>

          {/* Verification & Review Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Information Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              >
                <option value="Verified">Verified with Caller</option>
                <option value="Unverified">Unverified (Pending Call-back)</option>
                <option value="Needs Investigation">Needs Further Investigation</option>
                <option value="Disputed">Disputed / Clarified as Non-issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Final Case Review Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              >
                <option value="Reviewed & Verified">Reviewed & Verified</option>
                <option value="Escalated to Supervisor">Escalated to Supervisor</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Closed">Closed / Resolved</option>
              </select>
            </div>
          </div>

          {/* Operator Action Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Operator Notes & Actions Taken
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record caller's clarification, safe location confirmed, emergency liaison intimation, or advised safety steps..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-hidden leading-relaxed"
            />
          </div>

          {/* Footer Save Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Review...' : 'Save & Finalize Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
