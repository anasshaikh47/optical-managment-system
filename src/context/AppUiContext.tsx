"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { QuickSearchModal } from "@/components/QuickSearchModal";
import { MobileSyncModal } from "@/components/MobileSyncModal";
import { InstallPwaModal } from "@/components/InstallPwaModal";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";
import { APP_VERSION } from "@/config/version";

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
  // In-App Service Worker & Version Update Management
  isUpdateAvailable: boolean;
  applyAppUpdate: () => void;
  dismissUpdate: () => void;
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

  // In-App Version & Service Worker Update State
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

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

  // Register PWA Service Worker & Listen to PWA Install & Update Lifecycle
  useEffect(() => {
    if (typeof window === "undefined") return;

    let swRegistration: ServiceWorkerRegistration | null = null;
    let isReloading = false;

    // Listen for service worker controlling changes (when new worker activates)
    const handleControllerChange = () => {
      if (!isReloading) {
        isReloading = true;
        window.location.reload();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          swRegistration = reg;

          // 1. If there's an existing worker waiting, an update is already installed & ready
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setIsUpdateAvailable(true);
          }

          // 2. Listen for newly discovered updates
          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(installingWorker);
                setIsUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn("PWA SW registration:", err);
        });
    }

    // Version Polling Helper (compares client APP_VERSION with deployment /api/version)
    const checkServerVersion = async () => {
      try {
        if (swRegistration) {
          await swRegistration.update();
        }
        const res = await fetch(`/api/version?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.version && data.version !== APP_VERSION) {
            setIsUpdateAvailable(true);
          }
        }
      } catch {
        // network or offline
      }
    };

    // Initial server version check after 10 seconds of launch
    const initialCheckTimer = setTimeout(checkServerVersion, 10000);

    // Periodic check every 4 minutes
    const checkInterval = setInterval(checkServerVersion, 4 * 60 * 1000);

    // Recheck when tab gains focus or visibility returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkServerVersion();
      }
    };
    window.addEventListener("focus", checkServerVersion);
    document.addEventListener("visibilitychange", handleVisibilityChange);

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
      clearTimeout(initialCheckTimer);
      clearInterval(checkInterval);
      window.removeEventListener("focus", checkServerVersion);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      }
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

  // Trigger skipWaiting and instant UI reload without touching cloud database records
  const applyAppUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setIsUpdateAvailable(false);
  }, []);

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
        isUpdateAvailable,
        applyAppUpdate,
        dismissUpdate,
      }}
    >
      {children}

      {/* In-App Update Notification Banner (PWA / Service Worker Update) */}
      <AppUpdateBanner />

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
