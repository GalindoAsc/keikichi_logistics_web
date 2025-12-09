import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMe } from '../../hooks/useAuth';

export function VerificationBanner() {
    const { data: user } = useMe();

    if (!user || user.verification_status === 'verified' || user.role === 'superadmin' || user.role === 'manager') return null;

    const config = {
        pending_documents: {
            icon: AlertCircle,
            color: 'text-yellow-800',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            iconColor: 'text-yellow-600',
            title: 'Verificación requerida',
            message: 'Para realizar reservaciones necesitas verificar tu identidad subiendo tu INE.',
            action: 'Subir documentos',
            link: '/profile/verification'
        },
        pending_review: {
            icon: Clock,
            color: 'text-blue-800',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconColor: 'text-blue-600',
            title: 'Verificación en proceso',
            message: 'Estamos revisando tus documentos. Te notificaremos cuando tu cuenta esté activa.',
            action: null,
            link: null
        },
        rejected: {
            icon: XCircle,
            color: 'text-red-800',
            bg: 'bg-red-50',
            border: 'border-red-200',
            iconColor: 'text-red-600',
            title: 'Documentos rechazados',
            message: user.rejection_reason
                ? `Motivo: ${user.rejection_reason}`
                : 'Tus documentos fueron rechazados. Por favor intenta nuevamente.',
            action: 'Subir nuevamente',
            link: '/profile/verification'
        },
        verified: {
            icon: CheckCircle,
            color: 'text-green-800',
            bg: 'bg-green-50',
            border: 'border-green-200',
            iconColor: 'text-green-600',
            title: 'Cuenta verificada',
            message: 'Tu identidad ha sido confirmada.',
            action: null,
            link: null
        }
    }[user.verification_status] || null;

    if (!config) return null;

    const Icon = config.icon;

    return (
        <div className={`rounded-lg border p-4 mb-6 ${config.bg} ${config.border}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                    <div>
                        <h3 className={`text-sm font-medium ${config.color}`}>
                            {config.title}
                        </h3>
                        <div className={`mt-2 text-sm ${config.color} opacity-90`}>
                            <p>{config.message}</p>
                        </div>
                    </div>
                    {config.action && (
                        <div className="mt-4 md:mt-0 md:ml-6 flex items-center">
                            <Link
                                to={config.link!}
                                className={`whitespace-nowrap font-medium text-sm hover:underline ${config.iconColor}`}
                            >
                                {config.action} <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
