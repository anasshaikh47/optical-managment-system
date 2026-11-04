"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { QuickSearchModal } from "@/components/QuickSearchModal";
import { MobileSyncModal } from "@/components/MobileSyncModal";

interface AppUiContextType {
  openNewCustomerModal: () => void;
  closeNewCustomerModal: () => void;
  openQuickSearchModal: () => void;
  closeQuickSearchModal: () => void;
  openMobileSyncModal: () => void;
  closeMobileSyncModal: () => void;
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const AppUiContext = createContext<AppUiContextType | undefined>(undefined);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openNewCustomerModal = () => setIsNewCustomerOpen(true);
  const closeNewCustomerModal = () => setIsNewCustomerOpen(false);

  const openQuickSearchModal = () => setIsQuickSearchOpen(true);
  const closeQuickSearchModal = () => setIsQuickSearchOpen(false);

  const openMobileSyncModal = () => setIsMobileSyncOpen(true);
  const closeMobileSyncModal = () => setIsMobileSyncOpen(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleCustomerCreated = (newCust: any) => {
    setIsNewCustomerOpen(false);
    setToastMessage(`✓ Customer "${newCust.name}" successfully registered (+91 ${newCust.phone.replace(/[^0-9]/g, "").slice(-10)})`);
    setTimeout(() => setToastMessage(null), 4000);

    // Refresh active components without page reload
    window.dispatchEvent(new CustomEvent("customer-created", { detail: newCust }));
    router.refresh();
  };

  return (
    <AppUiContext.Provider
      value={{
        openNewCustomerModal,
        closeNewCustomerModal,
        openQuickSearchModal,
        closeQuickSearchModal,
        openMobileSyncModal,
        closeMobileSyncModal,
        isSidebarOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
      }}
    >
      {children}

      {/* Global In-App Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Modals */}
      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={closeNewCustomerModal}
        onSuccess={handleCustomerCreated}
      />

      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={closeQuickSearchModal}
      />

      <MobileSyncModal
        isOpen={isMobileSyncOpen}
        onClose={closeMobileSyncModal}
      />
    </AppUiContext.Provider>
  );
}

export function useAppUi() {
  const ctx = useContext(AppUiContext);
  if (!ctx) {
    throw new Error("useAppUi must be used within an AppUiProvider");
  }
  return ctx;
}
