import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, Camera, CameraOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function QRScannerPage() {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = "qr-scanner-container";

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
            setError("No se pudo acceder a la cámara. Verifica los permisos.");
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
            toast.success("Reservación encontrada!");

            // Navigate to reservation detail in admin view
            setTimeout(() => {
                navigate(`/admin/reservations?highlight=${reservationId}`);
            }, 500);
        } else {
            toast.error("QR no válido. Este no es un código de Keikichi.");
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Escáner de Reservaciones</h1>
                    <p className="text-gray-600 mt-2">
                        Escanea el código QR del resumen de pre-reservación para ver los detalles
                    </p>
                </div>

                {/* Scanner Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Scanner Container */}
                    <div className="relative bg-gray-900 aspect-square max-h-[400px]">
                        <div
                            id={scannerContainerId}
                            className="w-full h-full"
                            style={{ display: isScanning ? "block" : "none" }}
                        />

                        {!isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <CameraOff className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg opacity-70">Cámara inactiva</p>
                            </div>
                        )}

                        {/* Scan Frame Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-blue-400 rounded-lg">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-6">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {lastResult && (
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="text-green-700 text-sm font-medium">Último escaneo:</p>
                                    <p className="text-green-600 text-xs break-all">{lastResult}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={isScanning ? stopScanning : startScanning}
                            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${isScanning
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                        >
                            {isScanning ? (
                                <>
                                    <CameraOff className="w-6 h-6" />
                                    Detener Cámara
                                </>
                            ) : (
                                <>
                                    <Camera className="w-6 h-6" />
                                    Iniciar Escaneo
                                </>
                            )}
                        </button>

                        <p className="text-center text-gray-500 text-sm mt-4">
                            Apunta la cámara hacia el código QR del resumen de reservación
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">¿Cómo funciona?</h3>
                    <ol className="space-y-2 text-blue-800 text-sm">
                        <li className="flex gap-2">
                            <span className="font-bold">1.</span>
                            <span>Haz clic en "Iniciar Escaneo" para activar la cámara</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">2.</span>
                            <span>Apunta hacia el código QR del resumen de pre-reservación</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">3.</span>
                            <span>El sistema abrirá automáticamente los detalles de la reservación</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
