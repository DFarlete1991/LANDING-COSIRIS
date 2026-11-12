import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  // Enlaces de publicidad: ?contacto (o ?contacto=instagram) abre el formulario
  // al entrar. El valor queda como origen del lead. Se quita el parámetro de la
  // URL para que al recargar o compartir no se vuelva a abrir solo; los utm_* se quedan.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('contacto')) return;
    const origen = url.searchParams.get('contacto')?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    url.searchParams.delete('contacto');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    openContactModal({ sourceContext: origen ? `enlace_${origen}` : 'enlace_publicidad' });
  }, [openContactModal]);

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
