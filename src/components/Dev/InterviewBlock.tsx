"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { InterviewPayload, InterviewAnswer } from "../../../types/pToA/tools";

interface InterviewBlockProps {
  payload: InterviewPayload;
  initialAnswers?: InterviewAnswer[];
  onComplete: (answers: InterviewAnswer[]) => void;
  messageId?: string;
}

export function InterviewBlock({
  payload,
  initialAnswers,
  onComplete,
  messageId,
}: InterviewBlockProps) {
  const { questions } = payload;
  const total = questions.length;

  const initialAnswersMap = useMemo(() => {
    const out: (string[] | null)[] = questions.map(() => null);
    if (initialAnswers?.length) {
      for (const a of initialAnswers) {
        if (a.questionIndex >= 0 && a.questionIndex < total) {
          out[a.questionIndex] = a.selected ?? [];
        }
      }
    }
    return out;
  }, [questions.length, initialAnswers]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = initialAnswersMap.findIndex((a) => a === null);
    return firstUnanswered >= 0 ? firstUnanswered : total - 1;
  });
  const [answers, setAnswers] = useState<(string[] | null)[]>(initialAnswersMap);
  const [multiselectSelection, setMultiselectSelection] = useState<string[]>([]);

  const question = questions[currentIndex];
  const isMultiselect = question?.multiselect ?? false;
  const answeredCount = answers.filter((a) => a !== null && a.length > 0).length;
  const progressValue = total ? (answeredCount / total) * 100 : 0;

  const handleSingleSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = [option];
    setAnswers(newAnswers);
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      setMultiselectSelection([]);
    } else {
      onComplete(
        newAnswers.map((sel, i) => ({ questionIndex: i, selected: sel ?? [] }))
      );
    }
  };

  const handleMultiselectToggle = (option: string) => {
    setMultiselectSelection((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleMultiselectSend = () => {
    if (multiselectSelection.length === 0) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = [...multiselectSelection];
    setAnswers(newAnswers);
    setMultiselectSelection([]);
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(
        newAnswers.map((sel, i) => ({ questionIndex: i, selected: sel ?? [] }))
      );
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      const prevQ = questions[prev];
      setMultiselectSelection(prevQ?.multiselect ? (answers[prev] ?? []) : []);
    }
  };

  if (!question) return null;

  return (
    <div
      className="rounded-2xl border border-gray-700/60 bg-gray-900/50 p-4 max-w-lg"
      data-message-id={messageId}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs text-gray-400">
            Question {currentIndex + 1} of {total}
          </span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <div className="mb-4">
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
          {question.title}
        </span>
      </div>

      <p className="text-gray-200 mb-4 text-sm leading-relaxed">
        {question.description}
      </p>

      <div className="space-y-2 mb-4">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() =>
              isMultiselect
                ? handleMultiselectToggle(option)
                : handleSingleSelect(option)
            }
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
              isMultiselect
                ? multiselectSelection.includes(option)
                  ? "border-red-500/70 bg-red-500/20 text-red-100"
                  : "border-gray-600/70 bg-gray-800/50 text-gray-200 hover:border-gray-500 hover:bg-gray-700/50"
                : "border-gray-600/70 bg-gray-800/50 text-gray-200 hover:border-red-500/50 hover:bg-red-500/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-600/70 bg-gray-800/50 text-gray-300 text-sm hover:bg-gray-700/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        {isMultiselect && (
          <button
            type="button"
            onClick={handleMultiselectSend}
            disabled={multiselectSelection.length === 0}
            className="ml-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
