"use client";

import { Button } from "@/app/components/ui/button";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger"
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconColor: "text-red-500",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          borderColor: "border-red-200"
        };
      case "warning":
        return {
          iconColor: "text-yellow-500",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          borderColor: "border-yellow-200"
        };
      case "info":
        return {
          iconColor: "text-blue-500",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          borderColor: "border-blue-200"
        };
      default:
        return {
          iconColor: "text-red-500",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          borderColor: "border-red-200"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border ${styles.borderColor}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
