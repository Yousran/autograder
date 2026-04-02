"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

/**
 * Dialog containing a QR code scanner. Scanned QR codes are expected to be
 * the full join-link URL (e.g. https://example.com/en/join/ABC123). The
 * component extracts the join code from the URL and navigates to the join page.
 */
export function QrScannerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const router = useRouter();

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    const raw = detectedCodes[0]?.rawValue;
    if (!raw) return;

    try {
      // The QR value is the full join URL. Extract the join code from the path:
      // …/join/<joinCode>
      const url = new URL(raw);
      const segments = url.pathname.split("/").filter(Boolean);
      const joinIndex = segments.findIndex((s) => s === "join");
      const joinCode = joinIndex !== -1 ? segments[joinIndex + 1] : undefined;

      if (joinCode) {
        onOpenChange(false);
        router.push(`/join/${joinCode}`);
      } else {
        toast.error(t("Pages.home.invalidQrCode"));
      }
    } catch {
      toast.error(t("Pages.home.invalidQrCode"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Pages.home.scanQrCode")}</DialogTitle>
          <DialogDescription>
            {t("Pages.home.scanQrCodeDescription")}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <div className="overflow-hidden rounded-lg">
            <Scanner
              onScan={handleScan}
              formats={["qr_code"]}
              constraints={{ facingMode: "environment" }}
              components={{ finder: true }}
              scanDelay={600}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
