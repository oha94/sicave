import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stockService } from '../../services/stockService';
import { GlassCard } from '../../components/ui/GlassCard';
import { ArrowLeft, CheckCircle2, Printer, Truck, Calendar, MapPin, Package, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';

const DeliveryNoteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [reception, setReception] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);

    // Print Ref
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `BL-${reception?.reference_externe || 'Document'}`,
    });

    const fetchReception = async () => {
        if (!id) return;
        try {
            const data = await stockService.getReception(id);
            setReception(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReception();
    }, [id]);

    const handleValidate = async () => {
        if (!window.confirm("Valider cette réception et mettre à jour le stock ?")) return;
        setValidating(true);
        try {
            await stockService.validateReception(id!);
            await fetchReception();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la validation");
        } finally {
            setValidating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;
    if (!reception) return <div className="p-8 text-center text-red-500">Document introuvable</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button onClick={() => navigate('/stock/delivery-note')} className="flex items-center text-slate-500 hover:text-primary transition-colors mb-4">
                <ArrowLeft size={18} className="mr-1" /> Retour
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-800">Bon de Livraison</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${reception.status === 'validated'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {reception.status === 'validated' ? 'VALIDÉ' : 'BROUILLON'}
                        </span>
                    </div>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <FileText size={14} /> Réf: {reception.reference_externe || 'N/A'}
                        <span className="mx-2">•</span>
                        <Calendar size={14} /> {format(new Date(reception.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                </div>

                <div className="flex gap-2">
                    {reception.status !== 'validated' && (
                        <button
                            onClick={handleValidate}
                            disabled={validating}
                            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            <CheckCircle2 size={18} />
                            {validating ? 'Validation...' : 'Valider & Mettre en Stock'}
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
                    >
                        <Printer size={18} /> Imprimer
                    </button>

                    {/* Link to create Return if validated */}
                    {reception.status === 'validated' && (
                        <button
                            onClick={() => navigate('/stock/return-notes/new')} // We could pass state to pre-select
                            className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition flex items-center gap-2 shadow-sm"
                        >
                            Créer Résolution / Retour
                        </button>
                    )}
                </div>
            </div>

            {/* Display Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="md:col-span-2 space-y-4">
                    {/* ... Table content ... */}
                    <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Package className="text-primary" size={18} /> Produits Reçus
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3">Désignation</th>
                                    <th className="pb-3 text-right">Qté</th>
                                    <th className="pb-3 text-right">P.U.</th>
                                    <th className="pb-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reception.lines?.map((line: any) => (
                                    <tr key={line.id} className="text-sm">
                                        <td className="py-3">
                                            <div className="font-medium text-slate-700">{line.product?.designation}</div>
                                            <div className="text-slate-400 text-xs">{line.product?.sku}</div>
                                        </td>
                                        <td className="py-3 text-right font-medium">{line.quantity}</td>
                                        <td className="py-3 text-right text-slate-600">{line.unit_price?.toLocaleString()} Cfa fr</td>
                                        <td className="py-3 text-right font-semibold text-slate-700">
                                            {(line.quantity * line.unit_price).toLocaleString()} Cfa fr
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                <div className="space-y-6">
                    <GlassCard>
                        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
                            <Truck className="text-blue-500" size={18} /> Fournisseur
                        </h3>
                        {reception.supplier ? (
                            <div className="space-y-2 text-sm">
                                <div className="font-bold text-slate-800 text-lg">{reception.supplier.nom}</div>
                                <div className="text-slate-500">{reception.supplier.email}</div>
                                <div className="text-slate-500">{reception.supplier.telephone}</div>
                            </div>
                        ) : (
                            <div className="text-slate-400 italic">Information indisponible</div>
                        )}
                    </GlassCard>

                    <GlassCard>
                        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
                            <MapPin className="text-red-500" size={18} /> Entrepôt / Infos
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Entrepôt</span>
                                <span className="font-medium text-slate-700">{reception.warehouse?.nom || 'Entrepôt principal'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Créé par</span>
                                <span className="font-medium text-slate-700">Admin</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Hidden Printable Area */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm', overflow: 'hidden' }}>
                <div ref={componentRef} className="printable-content-a4 text-black">
                    <div className="text-center mb-8 border-b pb-4">
                        <h1 className="text-2xl font-bold uppercase mb-2">Bon de Livraison</h1>
                        <p className="text-sm">Réf: {reception.reference_externe}</p>
                        <p className="text-sm">Date: {format(new Date(reception.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>

                    <div className="flex justify-between mb-8">
                        <div>
                            <h3 className="font-bold underline mb-2">Fournisseur</h3>
                            <p>{reception.supplier?.nom}</p>
                            <p>{reception.supplier?.telephone}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold underline mb-2">Destinataire</h3>
                            <p>SICAVE</p>
                            <p>{reception.warehouse?.nom}</p>
                        </div>
                    </div>

                    <table className="w-full border-collapse mb-8">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Article</th>
                                <th className="border p-2 text-right">Qté</th>
                                <th className="border p-2 text-right">P.U.</th>
                                <th className="border p-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reception.lines?.map((line: any) => (
                                <tr key={line.id}>
                                    <td className="border p-2">
                                        {line.product?.designation}
                                        <br /><span className="text-xs text-gray-500">{line.product?.sku}</span>
                                    </td>
                                    <td className="border p-2 text-right">{line.quantity}</td>
                                    <td className="border p-2 text-right">{line.unit_price?.toLocaleString()}</td>
                                    <td className="border p-2 text-right">{(line.quantity * line.unit_price).toLocaleString()} Cfa fr</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="border p-2 text-right font-bold">Total</td>
                                <td className="border p-2 text-right font-bold">
                                    {reception.lines?.reduce((acc: number, l: any) => acc + (l.quantity * l.unit_price), 0).toLocaleString()} Cfa fr
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-12 flex justify-between text-sm">
                        <div className="w-1/3 border-t pt-2 text-center">Signature Livreur</div>
                        <div className="w-1/3 border-t pt-2 text-center">Signature Réceptionnaire</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryNoteDetail;

