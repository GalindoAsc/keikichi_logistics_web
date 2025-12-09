import { useNavigate } from 'react-router-dom';
import { INEUploadForm } from '../../components/auth/INEUploadForm';
import { useMe } from '../../hooks/useAuth';

export default function VerificationPage() {
    const navigate = useNavigate();
    const { data: user } = useMe();

    if (user?.verification_status === 'verified') {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✓</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                    ¡Ya estás verificado!
                </h1>
                <p className="text-slate-600 mb-8">
                    Tu identidad ha sido confirmada. Puedes realizar reservaciones sin restricciones.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Ir a Inicio
                </button>
            </div>
        );
    }

    if (user?.verification_status === 'pending_review') {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⏳</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                    Verificación en Proceso
                </h1>
                <p className="text-slate-600 mb-8">
                    Estamos revisando tus documentos. Te notificaremos cuando tu cuenta esté activa.
                    <br />
                    Esto usualmente toma menos de 24 horas.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 font-medium hover:underline"
                >
                    Volver a Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <INEUploadForm onComplete={() => window.location.reload()} />
            </div>
        </div>
    );
}
