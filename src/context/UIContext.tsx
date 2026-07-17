import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalParams {
  initialServices?: string[];
  sourceContext?: string;
}

interface UIContextValue {
  isContactModalOpen: boolean;
  modalParams: ModalParams;
  openContactModal: (params?: ModalParams) => void;
  closeContactModal: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UIContext = createContext<UIContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UIProvider({ children }: { children: ReactNode }) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [modalParams, setModalParams] = useState<ModalParams>({});

  const openContactModal = useCallback((params: ModalParams = {}) => {
    setModalParams(params);
    setIsContactModalOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setIsContactModalOpen(false);
    // Reset params after close animation
    setTimeout(() => setModalParams({}), 400);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({ isContactModalOpen, modalParams, openContactModal, closeContactModal }),
    [isContactModalOpen, modalParams, openContactModal, closeContactModal],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used inside <UIProvider>');
  }
  return ctx;
}
