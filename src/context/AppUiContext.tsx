"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { QuickSearchModal } from "@/components/QuickSearchModal";
import { MobileSyncModal } from "@/components/MobileSyncModal";
import { InstallPwaModal } from "@/components/InstallPwaModal";

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
  // PWA progressive web app state
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isInstallModalOpen: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  promptInstall: () => Promise<void>;
}

const AppUiContext = createContext<AppUiContextType | undefined>(undefined);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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

  // Register PWA Service Worker & Listen to PWA Install Lifecycle
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service worker active
        })
        .catch((err) => {
          console.warn("PWA SW registration:", err);
        });
    }

    // Check if running in standalone mode already
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    // Detect iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setToastMessage("✓ Optical Store ERP successfully installed as native app!");
      setTimeout(() => setToastMessage(null), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
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

  const openInstallModal = () => setIsInstallModalOpen(true);
  const closeInstallModal = () => setIsInstallModalOpen(false);

  const promptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        setToastMessage("✓ Optical POS installed! Launch it anytime from your home screen/desktop.");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

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
        isInstallable,
        isInstalled,
        isIos,
        isInstallModalOpen,
        openInstallModal,
        closeInstallModal,
        promptInstall,
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

      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
        onInstall={promptInstall}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIos={isIos}
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
