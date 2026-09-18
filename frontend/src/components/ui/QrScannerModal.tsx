"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Upload, Search, X, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { apiClient } from "@/services/api/client";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrScannerModal({ isOpen, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"camera" | "manual" | "upload">("camera");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanningStatus, setScanningStatus] = useState("Recherche du QR Code en cours...");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamically load jsQR library fallback
  const loadJsQR = (): Promise<any> => {
    return new Promise((resolve) => {
      if ((window as any).jsQR) {
        resolve((window as any).jsQR);
        return;
      }
      const existingScript = document.getElementById("jsqr-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve((window as any).jsQR));
        return;
      }
      const script = document.createElement("script");
      script.id = "jsqr-script";
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      script.onload = () => resolve((window as any).jsQR);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    } else if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setError("");
    setScanningStatus("Activation de la caméra...");
    await loadJsQR();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setScanningStatus("Placez le QR code au centre du cadre...");
          startScanningLoop();
        };
      }
    } catch (err: any) {
      console.warn("Erreur accès caméra:", err);
      setError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès ou utiliser la saisie manuelle.");
    }
  };

  const startScanningLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);

      let foundCode: string | null = null;

      // 1. Try Native BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            foundCode = barcodes[0].rawValue;
          }
        } catch (e) {
          // Fallback to jsQR
        }
      }

      // 2. Fallback to jsQR library
      if (!foundCode && (window as any).jsQR) {
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          const qr = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (qr && qr.data) {
            foundCode = qr.data;
          }
        } catch (e) {
          console.error("jsQR error:", e);
        }
      }

      if (foundCode) {
        setScanningStatus("QR Code détecté ! Redirection...");
        stopCamera();
        try {
          if (navigator.vibrate) navigator.vibrate(100);
        } catch (_) {}
        handleResolveCode(foundCode);
      }
    }, 250);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    await loadJsQR();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setLoading(false);
          return;
        }
        ctx.drawImage(img, 0, 0);

        let foundCode: string | null = null;

        // Try BarcodeDetector first
        if ("BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              foundCode = barcodes[0].rawValue;
            }
          } catch (e) {}
        }

        // Try jsQR fallback
        if (!foundCode && (window as any).jsQR) {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qr = (window as any).jsQR(imageData.data, imageData.width, imageData.height);
          if (qr && qr.data) {
            foundCode = qr.data;
          }
        }

        if (foundCode) {
          handleResolveCode(foundCode);
        } else {
          setError("Aucun QR Code valide décelé dans cette image.");
          setLoading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResolveCode = async (rawInput: string) => {
    if (!rawInput || rawInput.trim().length === 0) return;
    setLoading(true);
    setError("");

    let codeToSearch = rawInput.trim();

    // If input is a full URL e.g. http://localhost:3000/immobilisations/5?code=EMP-101
    const matchId = codeToSearch.match(/\/immobilisations\/(\d+)/);
    if (matchId && matchId[1]) {
      setLoading(false);
      stopCamera();
      onClose();
      router.push(`/immobilisations/${matchId[1]}`);
      return;
    }

    const matchCodeParam = codeToSearch.match(/code=([^&]+)/);
    if (matchCodeParam && matchCodeParam[1]) {
      codeToSearch = decodeURIComponent(matchCodeParam[1]);
    }

    try {
      const res: any = await apiClient.get(`/immobilisations/lookup/${encodeURIComponent(codeToSearch)}/`);
      if (res && res.id) {
        stopCamera();
        onClose();
        router.push(`/immobilisations/${res.id}`);
      } else {
        setError(`Aucune immobilisation trouvée pour le code "${codeToSearch}".`);
      }
    } catch (err: any) {
      setError(`Immobilisation avec le code "${codeToSearch}" non trouvée.`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleResolveCode(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-border relative overflow-hidden">
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Scanner QR Code Immobilisation</h2>
              <p className="text-xs text-muted-foreground">Recherche instantanée de la fiche équipement</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex space-x-1 bg-muted/40 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "camera" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Caméra Directe</span>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "upload" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer Image</span>
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "manual" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Saisie Code</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Feed with Active Frame Scanning */}
        {activeTab === "camera" && (
          <div className="space-y-3 text-center">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {/* Scanning Reticle & Animated Laser Line */}
              <div className="absolute inset-0 border-2 border-amber-500/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-amber-400/90 rounded-2xl relative flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  {/* Corner Reticles */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-md" />

                  {/* Laser Beam Animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-pulse" />
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-xs font-semibold">Redirection vers la fiche...</span>
                </div>
              )}
            </div>

            <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>{scanningStatus}</span>
            </p>
          </div>
        )}

        {/* Tab 2: Upload QR Image */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/30 hover:border-amber-500/60 rounded-2xl p-8 text-center bg-muted/10 transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xs font-bold text-foreground mb-1">
                Déposer ou choisir une photo / image de QR Code
              </p>
              <p className="text-[11px] text-muted-foreground mb-4">
                Formats acceptés : PNG, JPG, JPEG, WebP
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#332E2B] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Sélectionner une photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {loading && (
              <div className="flex items-center justify-center py-2 text-xs text-amber-600 gap-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyse de l'image en cours...</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Code Input */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Code Inventaire ou URL scannée
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: EMP-101, INV-2026-001..."
                  value={manualCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualCode(e.target.value)}
                  className="text-xs h-10"
                  autoFocus
                />
                <Button type="submit" disabled={loading || !manualCode} className="h-10 px-4 bg-[#1C1917] hover:bg-[#332E2B] text-white shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Entrez le code d'inventaire figurant sous le QR Code pour ouvrir directement la fiche de l'immobilisation.
            </p>
          </form>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
