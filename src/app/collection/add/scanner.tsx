"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { IScannerControls } from "@zxing/browser";
import type { DecodeHintType } from "@zxing/library";
import { VinylDisc } from "@/components/deco";
import {
  identifyCoverAction,
  lookupBarcodeAction,
  type ScanState,
} from "./actions";

const MAX_JPEG_SIDE = 1280;

async function drawToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<Blob> {
  const scale = Math.min(1, MAX_JPEG_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode failed"))),
      "image/jpeg",
      0.85,
    ),
  );
}

async function fileToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    return await drawToJpeg(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

export function Scanner({
  onResults,
}: {
  onResults: (state: ScanState) => void;
}) {
  const [live, setLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const runIdentify = useCallback(
    async (blob: Blob) => {
      const fd = new FormData();
      fd.set("image", new File([blob], "cover.jpg", { type: "image/jpeg" }));
      try {
        onResults(await identifyCoverAction(fd));
      } catch {
        onResults({ error: "Couldn't read that photo — try again." });
      }
    },
    [onResults],
  );

  const handleBarcode = useCallback(
    (text: string) => {
      stopCamera();
      startBusy(async () => {
        try {
          onResults(await lookupBarcodeAction(text));
        } catch {
          onResults({ error: "Lookup failed — try again." });
        }
      });
    },
    [onResults, stopCamera],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    const video = videoRef.current;
    if (!navigator.mediaDevices?.getUserMedia || !video) {
      setCameraError(
        "This browser can't use the camera — upload a photo instead.",
      );
      return;
    }
    try {
      // ZXing is loaded on demand so the ~300KB decoder stays out of the
      // initial bundle.
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
        await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 120,
      });
      setLive(true);
      handledRef.current = false;
      controlsRef.current = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: "environment" } },
        video,
        (result, _error, controls) => {
          if (!result || handledRef.current) return;
          handledRef.current = true;
          controls.stop();
          handleBarcode(result.getText());
        },
      );
    } catch {
      stopCamera();
      setCameraError(
        "Couldn't open the camera — allow access, or upload a photo instead.",
      );
    }
  }, [handleBarcode, stopCamera]);

  const snapCover = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || busy) return;
    startBusy(async () => {
      try {
        const blob = await drawToJpeg(
          video,
          video.videoWidth,
          video.videoHeight,
        );
        stopCamera();
        await runIdentify(blob);
      } catch {
        onResults({ error: "Couldn't grab that frame — try again." });
      }
    });
  }, [busy, onResults, runIdentify, stopCamera]);

  return (
    <div className="scanner-well">
      {/* The video element stays mounted so its ref is stable; it's only
          shown while the camera is live. */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={
          live && !busy ? "aspect-[4/3] w-full object-cover" : "hidden"
        }
      />

      {busy ? (
        <>
          <div className="scan-ring">
            <VinylDisc speed={2} className="w-[58px]" />
          </div>
          <p className="font-display text-[25px] leading-none text-cream">
            Matching the pressing…
          </p>
        </>
      ) : live ? (
        <>
          <span className="scan-line" aria-hidden />
          <p className="font-display text-[25px] leading-none text-cream">
            Hold the barcode up
          </p>
          <p className="font-accent text-[15px] italic text-cream/60">
            No barcode? Snap the front cover instead
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={snapCover}
              className="btn-gold px-4 py-2.5"
            >
              Snap the cover
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="btn-ghost px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="scan-ring">
            <VinylDisc speed={9} className="w-[58px]" />
          </div>
          <p className="font-display text-[25px] leading-none text-cream">
            Scan a record
          </p>
          <p className="font-accent text-[15px] italic text-cream/60">
            Barcode or front cover — we&apos;ll match the pressing
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startCamera}
              className="btn-gold px-4 py-2.5"
            >
              Scan with camera
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-ghost px-4 py-2.5"
            >
              Upload a photo
            </button>
          </div>
          {cameraError && (
            <p className="font-body text-[12px] text-red-400">{cameraError}</p>
          )}
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Upload a cover photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          startBusy(async () => {
            try {
              await runIdentify(await fileToJpeg(file));
            } catch {
              onResults({ error: "Couldn't read that photo — try again." });
            }
          });
        }}
      />
    </div>
  );
}
