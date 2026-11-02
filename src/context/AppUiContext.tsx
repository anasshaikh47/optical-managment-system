"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

const AppUiContext = createContext<AppUiContextType | undefined>(undefined);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);

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

  const handleCustomerCreated = (newCust: any) => {
    setIsNewCustomerOpen(false);
    // If user is currently on customer page, reload or navigate to new profile
    router.push(`/customers/${newCust.id}`);
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
      }}
    >
      {children}

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
