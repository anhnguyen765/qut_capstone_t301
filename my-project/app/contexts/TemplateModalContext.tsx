import React, { createContext, useContext, useState } from "react";

interface TemplateModalContextType {
  showNameModal: boolean;
  setShowNameModal: (v: boolean) => void;
  showEditor: boolean;
  setShowEditor: (v: boolean) => void;
}

const TemplateModalContext = createContext<TemplateModalContextType | undefined>(undefined);

export const useTemplateModal = () => {
  const ctx = useContext(TemplateModalContext);
  if (!ctx) throw new Error("useTemplateModal must be used within TemplateModalProvider");
  return ctx;
};

export const TemplateModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  return (
    <TemplateModalContext.Provider value={{ showNameModal, setShowNameModal, showEditor, setShowEditor }}>
      {children}
    </TemplateModalContext.Provider>
  );
};
