import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stockService } from '../../services/stockService';
import { GlassCard } from '../../components/ui/GlassCard';
import { ArrowLeft, Printer, Archive, AlertCircle, FileText, Calendar, Truck, PackageMinus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';

const ReturnNoteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [returnNote, setReturnNote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Print Ref
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Retour-${returnNote?.reference || 'Doc'}`,
    });

    const fetchReturn = async () => {
        if (!id) return;
        try {
            const data = await stockService.getSupplierReturn(id);
            setReturnNote(data);
        } catch (error) {
            console.error("Erreur chargement retour", error);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!window.confirm("Archiver ce bon de retour ? Cela signifie que le retour a été traité par le fournisseur.")) return;
        setUpdating(true);
        try {
            await stockService.updateSupplierReturnStatus(id!, 'archived');
            await fetchReturn();
        } catch (error) {
            console.error("Erreur archivage", error);
            alert("Erreur");
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        fetchReturn();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;
    if (!returnNote) return <div className="p-8 text-center text-red-500">Document introuvable</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button onClick={() => navigate('/stock/return-notes')} className="flex items-center text-slate-500 hover:text-primary transition-colors mb-4">
                <ArrowLeft size={18} className="mr-1" /> Retour à la liste
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-800">Bon de Retour</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${returnNote.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {returnNote.status === 'pending' ? 'EN ATTENTE' : 'ARCHIVÉ'}
                        </span>
                    </div>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <FileText size={14} /> Réf: {returnNote.reference}
                        <span className="mx-2">•</span>
                        <Calendar size={14} /> {format(new Date(returnNote.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                </div>

                <div className="flex gap-2">
                    {returnNote.status === 'pending' && (
                        <button
                            onClick={handleArchive}
                            disabled={updating}
                            className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-slate-800/20"
                        >
                            <Archive size={18} />
                            {updating ? 'Archivage...' : 'Marquer comme Résolu / Archiver'}
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
                    >
                        <Printer size={18} /> Imprimer
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="md:col-span-2 space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <PackageMinus className="text-amber-500" size={18} /> Lignes de Retour
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3">Produit</th>
                                    <th className="pb-3 text-right">Qté Retour</th>
                                    <th className="pb-3 text-left pl-4">Motif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {returnNote.lines?.map((line: any) => (
                                    <tr key={line.id} className="text-sm">
                                        <td className="py-3">
                                            <div className="font-medium text-slate-700">{line.product?.designation}</div>
                                            <div className="text-slate-400 text-xs">{line.product?.sku}</div>
                                        </td>
                                        <td className="py-3 text-right font-bold text-amber-600">{line.quantity}</td>
                                        <td className="py-3 pl-4 text-slate-600 italic">
                                            {line.reason}
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
                        {returnNote.supplier ? (
                            <div className="space-y-2 text-sm">
                                <div className="font-bold text-slate-800 text-lg">{returnNote.supplier.nom}</div>
                                <div className="text-slate-500">{returnNote.supplier.email}</div>
                                <div className="text-slate-500">{returnNote.supplier.telephone}</div>
                            </div>
                        ) : (
                            <div className="text-slate-400 italic">Information indisponible</div>
                        )}
                    </GlassCard>

                    <GlassCard>
                        <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
                            <AlertCircle className="text-amber-500" size={18} /> Contexte
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Basé sur BL</span>
                                <span className="font-medium text-slate-700">{returnNote.reception?.reference_externe || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Entrepôt</span>
                                <span className="font-medium text-slate-700">{returnNote.warehouse?.nom || 'N/A'}</span>
                            </div>
                            {returnNote.comments && (
                                <div className="mt-2 pt-2 border-t border-slate-50 text-slate-600 italic">
                                    "{returnNote.comments}"
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Hidden Printable Area */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm', overflow: 'hidden' }}>
                <div ref={componentRef} className="printable-content-a4 text-black">
                    <div className="text-center mb-8 border-b pb-4">
                        <h1 className="text-2xl font-bold uppercase mb-2">Bon de Retour Fournisseur</h1>
                        <p className="text-sm">Réf: {returnNote.reference}</p>
                        <p className="text-sm">Date: {format(new Date(returnNote.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>

                    <div className="flex justify-between mb-8">
                        <div>
                            <h3 className="font-bold underline mb-2">Émetteur</h3>
                            <p>SICAVE</p>
                            <p>{returnNote.warehouse?.nom}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold underline mb-2">Fournisseur (Destinataire)</h3>
                            <p>{returnNote.supplier?.nom}</p>
                            <p>{returnNote.supplier?.telephone}</p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 text-sm">
                        <strong>Contexte :</strong> Retour lié à la réception <strong>{returnNote.reception?.reference_externe}</strong>
                        {returnNote.comments && <p className="mt-1 italic">Note: {returnNote.comments}</p>}
                    </div>

                    <table className="w-full border-collapse mb-8">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Article</th>
                                <th className="border p-2 text-right">Qté Retournée</th>
                                <th className="border p-2 text-left">Motif</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnNote.lines?.map((line: any) => (
                                <tr key={line.id}>
                                    <td className="border p-2">
                                        {line.product?.designation}
                                        <br /><span className="text-xs text-gray-500">{line.product?.sku}</span>
                                    </td>
                                    <td className="border p-2 text-right font-bold">{line.quantity}</td>
                                    <td className="border p-2 italic">{line.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 flex justify-between text-sm">
                        <div className="w-1/3 border-t pt-2 text-center">Cachet & Signature SICAVE</div>
                        <div className="w-1/3 border-t pt-2 text-center">Reçu par le Fournisseur</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnNoteDetail;
