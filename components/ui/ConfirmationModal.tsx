"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconBgClass =
    variant === "danger"
      ? "bg-red-100"
      : variant === "warning"
      ? "bg-yellow-100"
      : "bg-blue-100";

  const iconColorClass =
    variant === "danger"
      ? "text-red-600"
      : variant === "warning"
      ? "text-yellow-600"
      : "text-blue-600";

  const buttonClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : variant === "warning"
      ? "bg-yellow-600 hover:bg-yellow-700"
      : "bg-[#3182ce] hover:bg-[#2c5cb8]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle className={`w-6 h-6 ${iconColorClass}`} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${buttonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}