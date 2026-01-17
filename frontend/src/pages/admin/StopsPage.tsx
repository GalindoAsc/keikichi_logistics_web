import { useState } from "react";
import { MapPin, Plus, Trash2, ArrowLeft, Clock, Edit2, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStops } from "../../hooks/useProducts";
import { toast } from "sonner";
import { SavedStop, SavedStopCreate } from "../../api/catalog";
import { useTranslation } from "react-i18next";

const StopsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { stops, addStop, removeStop, updateStop } = useStops();
    
    // Form state
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("USA");
    const [defaultContact, setDefaultContact] = useState("");
    const [defaultPhone, setDefaultPhone] = useState("");
    const [defaultSchedule, setDefaultSchedule] = useState("");
    const [notes, setNotes] = useState("");
    
    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<SavedStopCreate>>({});

    const resetForm = () => {
        setName("");
        setAddress("");
        setCity("");
        setState("");
        setCountry("USA");
        setDefaultContact("");
        setDefaultPhone("");
        setDefaultSchedule("");
        setNotes("");
    };

    const handleAddStop = async () => {
        if (!name.trim()) return;
        try {
            await addStop({
                name: name.trim(),
                address: address.trim() || undefined,
                city: city.trim() || undefined,
                state: state.trim() || undefined,
                country: country.trim() || undefined,
                default_contact: defaultContact.trim() || undefined,
                default_phone: defaultPhone.trim() || undefined,
                default_schedule: defaultSchedule.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            resetForm();
            toast.success(t('stops.added'));
        } catch (error) {
            toast.error(t('stops.errorAdding'));
        }
    };

    const handleRemoveStop = async (id: number, stopName: string) => {
        if (confirm(`${t('stops.confirmDelete')} "${stopName}"?`)) {
            try {
                await removeStop(id);
                toast.success(t('stops.deleted'));
            } catch (error) {
                toast.error(t('stops.errorDeleting'));
            }
        }
    };

    const startEdit = (stop: SavedStop) => {
        setEditingId(stop.id);
        setEditForm({
            name: stop.name,
            address: stop.address || "",
            city: stop.city || "",
            state: stop.state || "",
            country: stop.country || "USA",
            default_contact: stop.default_contact || "",
            default_phone: stop.default_phone || "",
            default_schedule: stop.default_schedule || "",
            notes: stop.notes || "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId || !editForm.name?.trim()) return;
        try {
            await updateStop({ id: editingId, data: editForm });
            toast.success(t('stops.updated'));
            cancelEdit();
        } catch (error) {
            toast.error(t('stops.errorUpdating'));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-200 flex items-center gap-2 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('common.backToSettings')}
            </button>

            <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-6 h-6 text-keikichi-lime-600" />
                <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('stops.title')}</h1>
            </div>

            <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-4">
                {t('stops.description')}
            </p>

            {/* Formulario para agregar nueva parada */}
            <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border dark:border-keikichi-forest-600 p-6 shadow-sm space-y-4 transition-colors">
                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {t('stops.addNew')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.name')} *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.namePlaceholder')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.schedule')}</label>
                        <input
                            type="text"
                            value={defaultSchedule}
                            onChange={(e) => setDefaultSchedule(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.schedulePlaceholder')}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.address')}</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.addressPlaceholder')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.city')}</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.cityPlaceholder')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.state')}</label>
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.statePlaceholder')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.contact')}</label>
                        <input
                            type="text"
                            value={defaultContact}
                            onChange={(e) => setDefaultContact(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.contactPlaceholder')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('stops.phone')}</label>
                        <input
                            type="text"
                            value={defaultPhone}
                            onChange={(e) => setDefaultPhone(e.target.value)}
                            className="w-full border dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            placeholder={t('stops.phonePlaceholder')}
                        />
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button
                        onClick={handleAddStop}
                        disabled={!name.trim()}
                        className="bg-keikichi-lime-600 text-white px-4 py-2 rounded-md hover:bg-keikichi-lime-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t('stops.add')}
                    </button>
                </div>
            </div>

            {/* Lista de paradas guardadas */}
            <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border dark:border-keikichi-forest-600 shadow-sm transition-colors">
                <div className="p-4 border-b dark:border-keikichi-forest-600">
                    <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white">
                        {t('stops.savedStops')} ({stops.length})
                    </h2>
                </div>
                
                <div className="divide-y dark:divide-keikichi-forest-600">
                    {stops.map((stop: SavedStop) => (
                        <div key={stop.id} className="p-4 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 transition-colors">
                            {editingId === stop.id ? (
                                // Modo edición
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={editForm.name || ""}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700"
                                            placeholder={t('stops.name')}
                                        />
                                        <input
                                            type="text"
                                            value={editForm.default_schedule || ""}
                                            onChange={(e) => setEditForm({ ...editForm, default_schedule: e.target.value })}
                                            className="border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700"
                                            placeholder={t('stops.schedule')}
                                        />
                                        <input
                                            type="text"
                                            value={editForm.address || ""}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            className="md:col-span-2 border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700"
                                            placeholder={t('stops.address')}
                                        />
                                        <input
                                            type="text"
                                            value={editForm.default_contact || ""}
                                            onChange={(e) => setEditForm({ ...editForm, default_contact: e.target.value })}
                                            className="border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700"
                                            placeholder={t('stops.contact')}
                                        />
                                        <input
                                            type="text"
                                            value={editForm.default_phone || ""}
                                            onChange={(e) => setEditForm({ ...editForm, default_phone: e.target.value })}
                                            className="border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700"
                                            placeholder={t('stops.phone')}
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={cancelEdit}
                                            className="px-3 py-1 text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-800"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            className="px-3 py-1 text-sm bg-keikichi-lime-600 text-white rounded hover:bg-keikichi-lime-700"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Modo visualización
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-keikichi-forest-800 dark:text-white">{stop.name}</span>
                                            {stop.default_schedule && (
                                                <span className="text-xs bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30 text-keikichi-lime-700 dark:text-keikichi-lime-400 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {stop.default_schedule}
                                                </span>
                                            )}
                                        </div>
                                        {stop.address && (
                                            <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-400 mt-1">
                                                {stop.address}
                                            </p>
                                        )}
                                        {(stop.city || stop.state) && (
                                            <p className="text-sm text-keikichi-forest-400 dark:text-keikichi-lime-500">
                                                {[stop.city, stop.state, stop.country].filter(Boolean).join(", ")}
                                            </p>
                                        )}
                                        {stop.default_contact && (
                                            <p className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-500 mt-1">
                                                {t('stops.contact')}: {stop.default_contact} {stop.default_phone && `• ${stop.default_phone}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(stop)}
                                            className="text-keikichi-forest-400 dark:text-keikichi-lime-500 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 transition-colors"
                                            title={t('common.edit')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveStop(stop.id, stop.name)}
                                            className="text-keikichi-forest-400 dark:text-keikichi-lime-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {stops.length === 0 && (
                        <div className="p-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">
                            {t('stops.noStops')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StopsPage;
