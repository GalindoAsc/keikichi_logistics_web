import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, Calendar, Clock, ArrowRight, TrendingUp, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UpcomingTrip {
    id: string;
    origin: string;
    destination: string;
    departure_date: string;
    total_spaces: number;
    available: number;
    on_hold: number;
    reserved: number;
    occupancy_percent: number;
}

interface DashboardStats {
    pending_payments: number;
    revenue_by_currency: {
        total: Record<string, number>;
        monthly: Record<string, number>;
    };
    active_trips: number;
    total_reservations: number;
    upcoming_trips: UpcomingTrip[];
    recent_reservations: Array<{
        id: string;
        client_name: string;
        amount: number;
        currency: string;
        status: string;
        payment_status: string;
        created_at: string;
    }>;
}

const formatCurrencyBreakdown = (data: Record<string, number> | undefined) => {
    if (!data || Object.keys(data).length === 0) return "$0.00";

    return (
        <div className="flex flex-col items-start gap-0.5">
            {Object.entries(data).map(([currency, amount]) => (
                <span key={currency} className="text-lg font-bold">
                    <span className="text-xs text-slate-400 font-medium mr-1">{currency}</span>
                    ${amount.toLocaleString()}
                </span>
            ))}
        </div>
    );
};

export default function AdminDashboardPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-dashboard-stats"],
        queryFn: async () => {
            const res = await api.get<DashboardStats>("/admin/dashboard/stats");
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Pagos Pendientes",
            value: stats?.pending_payments || 0,
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            link: "/admin/reservations?status=pending_review"
        },
        {
            title: "Ingresos del Mes",
            value: formatCurrencyBreakdown(stats?.revenue_by_currency.monthly),
            isComplexValue: true,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            link: "/admin/reservations?status=paid"
        },
        {
            title: "Ingresos Totales",
            value: formatCurrencyBreakdown(stats?.revenue_by_currency.total),
            isComplexValue: true,
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50",
            link: "/admin/reservations?status=paid"
        },
        {
            title: "Viajes Activos",
            value: stats?.active_trips || 0,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
            link: "/admin/trips"
        },
        {
            title: "Total Reservaciones",
            value: stats?.total_reservations || 0,
            icon: Calendar,
            color: "text-purple-600",
            bg: "bg-purple-50",
            link: "/admin/reservations"
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-heading text-slate-900">Panel de Administración</h1>
                <span className="text-sm text-slate-500 font-medium font-numeric">
                    {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-2">{stat.title}</p>
                                {stat.isComplexValue ? (
                                    stat.value
                                ) : (
                                    <p className="text-3xl font-bold font-numeric text-slate-900">{stat.value}</p>
                                )}
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Upcoming Trips */}
            {stats?.upcoming_trips && stats.upcoming_trips.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            Próximos Viajes <span className="text-slate-400 font-normal text-sm ml-1">(7 días)</span>
                        </h2>
                        <Link to="/admin/trips" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {stats.upcoming_trips.map((trip) => (
                            <Link
                                to={`/admin/trips/${trip.id}/spaces`}
                                key={trip.id}
                                className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <p className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {trip.origin} → {trip.destination}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-full">
                                        {format(new Date(trip.departure_date), "EEEE d 'de' MMMM", { locale: es })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right text-xs space-y-1">
                                        <div className="flex items-center justify-end gap-1.5 text-slate-600">
                                            <span>{trip.available} libres</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1.5 text-slate-600">
                                            <span>{trip.reserved} reservados</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        </div>
                                    </div>
                                    <div className="w-24">
                                        <div className="text-xs font-bold font-numeric text-center mb-1.5 text-slate-700">
                                            {trip.occupancy_percent}% Ocupado
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${trip.occupancy_percent >= 80 ? 'bg-emerald-500' :
                                                    trip.occupancy_percent >= 50 ? 'bg-amber-400' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${trip.occupancy_percent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <h2 className="text-lg font-bold font-heading text-slate-900">Actividad Reciente</h2>
                    <Link to="/admin/reservations" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
                        Ver todas <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {stats?.recent_reservations.map((res) => (
                        <Link to={`/admin/reservations?id=${res.id}`} key={res.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                                    {res.client_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{res.client_name}</p>
                                    <p className="text-xs text-slate-500">
                                        Reservación <span className="font-mono text-slate-400">#{res.id.split('-')[0]}</span> • {format(new Date(res.created_at), "d MMM, HH:mm", { locale: es })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold font-numeric text-slate-900">
                                    <span className="text-[10px] text-slate-400 mr-1 align-top">{res.currency || 'USD'}</span>
                                    ${res.amount.toLocaleString()}
                                </p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase mt-1 inline-block
                                    ${res.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                        res.payment_status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-600'}`}>
                                    {res.payment_status === 'paid' ? 'Pagado' :
                                        res.payment_status === 'pending_review' ? 'Revisión' : 'Pendiente'}
                                </span>
                            </div>
                        </Link>
                    ))}
                    {stats?.recent_reservations.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            No hay actividad reciente
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
