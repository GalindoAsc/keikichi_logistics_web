import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, Calendar, Clock, ArrowRight, TrendingUp, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

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
                    <span className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-400 font-medium mr-1">{currency}</span>
                    ${amount.toLocaleString()}
                </span>
            ))}
        </div>
    );
};

export default function AdminDashboardPage() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keikichi-lime-600"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: t('dashboard.pendingPayments'),
            value: stats?.pending_payments || 0,
            icon: Clock,
            color: "text-keikichi-yellow-600 dark:text-keikichi-yellow-400",
            bg: "bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20",
            link: "/admin/reservations?status=pending_review"
        },
        {
            title: t('dashboard.monthlyRevenue'),
            value: formatCurrencyBreakdown(stats?.revenue_by_currency.monthly),
            isComplexValue: true,
            icon: TrendingUp,
            color: "text-keikichi-lime-600 dark:text-keikichi-lime-400",
            bg: "bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20",
            link: "/admin/reservations?status=paid"
        },
        {
            title: t('dashboard.totalRevenue'),
            value: formatCurrencyBreakdown(stats?.revenue_by_currency.total),
            isComplexValue: true,
            icon: DollarSign,
            color: "text-keikichi-lime-600 dark:text-keikichi-lime-400",
            bg: "bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20",
            link: "/admin/reservations?status=paid"
        },
        {
            title: t('dashboard.activeTrips'),
            value: stats?.active_trips || 0,
            icon: Package,
            color: "text-keikichi-forest-600 dark:text-keikichi-lime-400",
            bg: "bg-keikichi-forest-50 dark:bg-keikichi-forest-700/50",
            link: "/admin/trips"
        },
        {
            title: t('dashboard.totalReservations'),
            value: stats?.total_reservations || 0,
            icon: Calendar,
            color: "text-keikichi-yellow-600 dark:text-keikichi-yellow-400",
            bg: "bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20",
            link: "/admin/reservations"
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-heading text-keikichi-forest-800 dark:text-white">{t('dashboard.title')}</h1>
                <span className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300 font-medium font-numeric">
                    {format(new Date(), i18n.language === 'es' ? "EEEE, d 'de' MMMM yyyy" : "EEEE, MMMM d, yyyy", { locale: dateLocale })}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white/80 dark:bg-keikichi-forest-800/80 backdrop-blur-sm p-6 rounded-2xl border border-keikichi-lime-100/60 dark:border-keikichi-forest-600 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-keikichi-forest-500 dark:text-keikichi-lime-300 mb-2">{stat.title}</p>
                                {stat.isComplexValue ? (
                                    stat.value
                                ) : (
                                    <p className="text-3xl font-bold font-numeric text-keikichi-forest-800 dark:text-white">{stat.value}</p>
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
                <div className="bg-white dark:bg-keikichi-forest-800 rounded-2xl border border-keikichi-lime-100 dark:border-keikichi-forest-600 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-keikichi-lime-50 dark:border-keikichi-forest-600 flex justify-between items-center bg-keikichi-lime-50/30 dark:bg-keikichi-forest-700/20">
                        <h2 className="text-lg font-bold font-heading text-keikichi-forest-800 dark:text-white flex items-center gap-2">
                            <Truck className="w-5 h-5 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                            {t('trips.upcomingTrips')} <span className="text-keikichi-forest-400 dark:text-keikichi-lime-400 font-normal text-sm ml-1">(7 {t('trips.days')})</span>
                        </h2>
                        <Link to="/admin/trips" className="text-sm text-keikichi-lime-600 dark:text-keikichi-lime-400 hover:text-keikichi-lime-700 dark:hover:text-keikichi-lime-300 font-medium flex items-center gap-1 transition-colors">
                            {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                        {stats.upcoming_trips.map((trip) => (
                            <Link
                                to={`/admin/trips/${trip.id}/spaces`}
                                key={trip.id}
                                className="p-5 hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <p className="text-base font-bold text-keikichi-forest-800 dark:text-white group-hover:text-keikichi-lime-600 dark:group-hover:text-keikichi-lime-400 transition-colors">
                                        {trip.origin} → {trip.destination}
                                    </p>
                                    <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-300 mt-1 font-medium bg-keikichi-lime-50 dark:bg-keikichi-forest-700 inline-block px-2 py-0.5 rounded-full">
                                        {format(new Date(trip.departure_date), i18n.language === 'es' ? "EEEE d 'de' MMMM" : "EEEE, MMMM d", { locale: dateLocale })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right text-xs space-y-1">
                                        <div className="flex items-center justify-end gap-1.5 text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                            <span>{trip.available} {t('trips.available')}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-keikichi-lime-500"></span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1.5 text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                            <span>{trip.reserved} {t('trips.reserved')}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-keikichi-yellow-500"></span>
                                        </div>
                                    </div>
                                    <div className="w-24">
                                        <div className="text-xs font-bold font-numeric text-center mb-1.5 text-keikichi-forest-700 dark:text-keikichi-lime-200">
                                            {trip.occupancy_percent}% {t('trips.occupied')}
                                        </div>
                                        <div className="h-2 bg-keikichi-lime-50 dark:bg-keikichi-forest-700 rounded-full overflow-hidden border border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${trip.occupancy_percent >= 80 ? 'bg-keikichi-lime-500' :
                                                    trip.occupancy_percent >= 50 ? 'bg-keikichi-yellow-400' : 'bg-keikichi-forest-400'
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
            <div className="bg-white dark:bg-keikichi-forest-800 rounded-2xl border border-keikichi-lime-100 dark:border-keikichi-forest-600 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-keikichi-lime-50 dark:border-keikichi-forest-600 flex justify-between items-center bg-keikichi-lime-50/30 dark:bg-keikichi-forest-700/20">
                    <h2 className="text-lg font-bold font-heading text-keikichi-forest-800 dark:text-white">{t('dashboard.recentActivity')}</h2>
                    <Link to="/admin/reservations" className="text-sm text-keikichi-lime-600 dark:text-keikichi-lime-400 hover:text-keikichi-lime-700 dark:hover:text-keikichi-lime-300 font-medium flex items-center gap-1 transition-colors">
                        {t('dashboard.viewAllFem')} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                    {stats?.recent_reservations.map((res) => (
                        <Link to={`/admin/reservations?id=${res.id}`} key={res.id} className="p-4 hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 flex items-center justify-center text-keikichi-lime-600 dark:text-keikichi-lime-400 font-bold text-sm border border-keikichi-lime-100 dark:border-keikichi-lime-800">
                                    {res.client_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-keikichi-forest-800 dark:text-white group-hover:text-keikichi-lime-600 dark:group-hover:text-keikichi-lime-400 transition-colors">{res.client_name}</p>
                                    <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-300">
                                        {t('reservations.reservation')} <span className="font-mono text-keikichi-forest-400 dark:text-keikichi-lime-400">#{res.id.split('-')[0]}</span> • {format(new Date(res.created_at), "d MMM, HH:mm", { locale: dateLocale })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold font-numeric text-keikichi-forest-800 dark:text-white">
                                    <span className="text-[10px] text-keikichi-forest-400 dark:text-keikichi-lime-400 mr-1 align-top">{res.currency || 'USD'}</span>
                                    ${res.amount.toLocaleString()}
                                </p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase mt-1 inline-block
                                    ${res.payment_status === 'paid' ? 'bg-keikichi-lime-100 text-keikichi-lime-700 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400' :
                                        res.payment_status === 'pending_review' ? 'bg-keikichi-yellow-100 text-keikichi-yellow-700 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {res.payment_status === 'paid' ? t('reservations.status.paid') :
                                        res.payment_status === 'pending_review' ? t('reservations.status.pendingReview') : t('reservations.status.pending')}
                                </span>
                            </div>
                        </Link>
                    ))}
                    {stats?.recent_reservations.length === 0 && (
                        <div className="p-12 text-center text-keikichi-forest-400 dark:text-keikichi-lime-400">
                            {t('dashboard.noRecentActivity')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
