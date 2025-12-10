import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, Camera, CameraOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function QRScannerPage() {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = "qr-scanner-container";
    const { t } = useTranslation();

    const startScanning = async () => {
        try {
            setError(null);
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                () => {
                    // QR not found - ignore
                }
            );
            setIsScanning(true);
        } catch (err) {
            console.error("Error starting scanner:", err);
            setError(t('scanner.cameraError'));
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        setLastResult(decodedText);

        // Parse the QR code - format: keikichi:reservation:UUID
        if (decodedText.startsWith("keikichi:reservation:")) {
            const reservationId = decodedText.replace("keikichi:reservation:", "");
            stopScanning();
            toast.success(t('scanner.scanSuccess'));

            // Navigate to reservation detail in admin view
            setTimeout(() => {
                navigate(`/admin/reservations?highlight=${reservationId}`);
            }, 500);
        } else {
            toast.error(t('scanner.scanInvalid'));
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="min-h-[calc(100vh-200px)] py-8 transition-colors">
            <div className="max-w-lg mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-keikichi-lime-600 rounded-full mb-4">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('scanner.title')}</h1>
                    <p className="text-keikichi-forest-500 dark:text-keikichi-lime-300 mt-2">
                        {t('scanner.subtitle')}
                    </p>
                </div>

                {/* Scanner Card */}
                <div className="bg-white dark:bg-keikichi-forest-800 rounded-2xl shadow-lg overflow-hidden transition-colors border border-keikichi-lime-100 dark:border-keikichi-forest-600">
                    {/* Scanner Container */}
                    <div className="relative bg-keikichi-forest-900 aspect-[4/3]">
                        <div
                            id={scannerContainerId}
                            className="w-full h-full"
                            style={{ display: isScanning ? "block" : "none" }}
                        />

                        {!isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <CameraOff className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg opacity-70">{t('scanner.cameraInactive')}</p>
                            </div>
                        )}

                        {/* Scan Frame Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-keikichi-lime-400 rounded-lg">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-keikichi-lime-500 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-keikichi-lime-500 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-keikichi-lime-500 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-keikichi-lime-500 rounded-br-lg" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-6">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {lastResult && (
                            <div className="flex items-center gap-3 p-4 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 border border-keikichi-lime-200 dark:border-keikichi-lime-800 rounded-lg mb-4">
                                <CheckCircle className="w-5 h-5 text-keikichi-lime-500 flex-shrink-0" />
                                <div>
                                    <p className="text-keikichi-lime-700 dark:text-keikichi-lime-300 text-sm font-medium">{t('scanner.lastScan')}:</p>
                                    <p className="text-keikichi-lime-600 dark:text-keikichi-lime-400 text-xs break-all">{lastResult}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={isScanning ? stopScanning : startScanning}
                            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${isScanning
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-keikichi-lime-600 hover:bg-keikichi-lime-700 text-white"
                                }`}
                        >
                            {isScanning ? (
                                <>
                                    <CameraOff className="w-6 h-6" />
                                    {t('scanner.stopScan')}
                                </>
                            ) : (
                                <>
                                    <Camera className="w-6 h-6" />
                                    {t('scanner.startScan')}
                                </>
                            )}
                        </button>

                        <p className="text-center text-keikichi-forest-500 dark:text-keikichi-lime-400 text-sm mt-4">
                            {t('scanner.pointCamera')}
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 border border-keikichi-lime-200 dark:border-keikichi-lime-800 rounded-xl p-6">
                    <h3 className="font-semibold text-keikichi-lime-800 dark:text-keikichi-lime-300 mb-3">{t('scanner.howItWorks')}</h3>
                    <ol className="space-y-2 text-keikichi-lime-700 dark:text-keikichi-lime-200 text-sm">
                        <li className="flex gap-2">
                            <span className="font-bold">1.</span>
                            <span>{t('scanner.step1')}</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">2.</span>
                            <span>{t('scanner.step2')}</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">3.</span>
                            <span>{t('scanner.step3')}</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
