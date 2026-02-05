import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, UploadCloud, CheckCircle } from 'lucide-react';
import api from '../../services/api';

interface InvoiceA4Props {
    invoice: any;
    onClose: () => void;
}

const InvoiceA4: React.FC<InvoiceA4Props> = ({ invoice, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const [settings, setSettings] = useState<any>({});
    const [localInvoice, setLocalInvoice] = useState(invoice);
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        setLocalInvoice(invoice);
    }, [invoice]);

    useEffect(() => {
        api.getSettings().then(setSettings);
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Facture-${localInvoice.reference}`
    });

    const handleSign = async () => {
        if (!confirm("Voulez-vous déclarer cette facture à la DGI ?")) return;
        setIsSigning(true);
        try {
            const res = await api.signInvoice(localInvoice.id);
            setLocalInvoice(res.invoice);
            alert("Facture déclarée avec succès !");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la déclaration");
        } finally {
            setIsSigning(false);
        }
    };

    const dgiUrl = localInvoice.dgi_qr_url;
    const dgiReference = localInvoice.dgi_reference;
    const isDgi = !!dgiReference;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-100 p-4 rounded-xl shadow-2xl max-h-[95vh] overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                    <h3 className="font-bold text-slate-700">Aperçu Facture A4</h3>
                    <div className="flex gap-2">
                        {!isDgi && (
                            <button
                                onClick={handleSign}
                                disabled={isSigning}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSigning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadCloud size={18} />}
                                <span>{isSigning ? 'Déclaration...' : 'Déclarer DGI'}</span>
                            </button>
                        )}
                        {isDgi && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                <CheckCircle size={18} />
                                <span className="font-bold text-xs uppercase tracking-wide">Déclaré</span>
                            </div>
                        )}
                        <button onClick={() => handlePrint && handlePrint()} className="btn-primary py-2 px-4 flex items-center gap-2">
                            <Printer size={18} /> Imprimer
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* A4 Container */}
                <div className="overflow-auto bg-slate-200 p-4 flex justify-center">
                    <div
                        ref={componentRef}
                        className="bg-white text-black p-[10mm] shadow-lg printable-content-a4"
                        style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}
                    >
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-8">
                            {/* Company Info Box */}
                            <div className="border border-black rounded-lg p-4 w-[55%] text-sm">
                                <h1 className="font-bold text-lg uppercase mb-2">{settings.company_name || 'NOM DE L\'ENTREPRISE'}</h1>
                                <div className="space-y-1">
                                    <p><strong>NCC :</strong> {settings.company_ncc || 'N/A'}</p>
                                    <p><strong>Régime d'imposition :</strong> {settings.company_tax_regime || 'N/A'}</p>
                                    <p><strong>Centre des impôts :</strong> {settings.company_tax_center || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Logo & Invoice Info */}
                            <div className="w-[40%] text-right flex flex-col items-end">
                                {settings.company_logo && <img src={settings.company_logo} alt="Logo" className="h-16 mb-2 object-contain" />}
                                <h2 className="font-bold text-lg mb-2">Facture de vente N° {invoice.reference}</h2>
                                {isDgi && (
                                    <div className="flex flex-col items-center border border-green-500/30 p-2 rounded bg-green-50/50">
                                        <QRCodeSVG value={dgiUrl} size={80} />
                                        <span className="text-[8px] mt-1 text-green-700 font-bold uppercase tracking-widest">Facture Normalisée</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="flex gap-8 mb-8 text-xs leading-relaxed">
                            {/* Left Column */}
                            <div className="flex-1 space-y-1">
                                <p><strong>RCCM :</strong> {settings.company_rccm}</p>
                                <p><strong>Références bancaires :</strong> {settings.company_bank}</p>
                                <p><strong>Établissement :</strong> {settings.company_name}</p>
                                <p><strong>Adresse :</strong> {settings.company_address}</p>
                                <p><strong>N° Tel :</strong> {settings.company_phone}</p>
                                <p><strong>Mail :</strong> {settings.company_email}</p>
                                <p><strong>Nom du vendeur :</strong> {invoice.user?.name || 'Admin'}</p>
                                <p><strong>Nom de PDV :</strong> {invoice.warehouse?.name || 'SIEGE'}</p>
                                <p><strong>Date et heure :</strong> {formatDate(invoice.created_at)}</p>
                                <p><strong>Mode de paiement :</strong> {invoice.payment_method || 'Espèces'}</p>
                                {isDgi && <p className="mt-2 font-mono"><strong>MECeF NIM:</strong> {dgiReference}</p>}
                            </div>

                            {/* Right Column (Client) */}
                            <div className="w-[40%] space-y-1 pt-4">
                                <p className="font-bold text-sm mb-2">Client</p>
                                <p><strong>Nom :</strong> {invoice.client?.nom || 'Client Comptoir'}</p>
                                <p><strong>Adresse :</strong> {invoice.client?.adresse || ''}</p>
                                <p><strong>NCC :</strong> {invoice.client?.ncc || ''}</p>
                                <p><strong>Tel :</strong> {invoice.client?.telephone || ''}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-xs mb-8 border-collapse">
                            <thead>
                                <tr className="border border-black font-bold text-center bg-slate-50">
                                    <th className="border-r border-black p-2 w-[10%]">Réf</th>
                                    <th className="border-r border-black p-2 text-left">Désignation</th>
                                    <th className="border-r border-black p-2 w-[10%]">P.U HT</th>
                                    <th className="border-r border-black p-2 w-[5%]">Qté</th>
                                    <th className="border-r border-black p-2 w-[5%]">Unité</th>
                                    <th className="border-r border-black p-2 w-[10%]">Taxes (%)</th>
                                    <th className="border-r border-black p-2 w-[8%]">Rem. (%)</th>
                                    <th className="p-2 w-[12%]">Montant HT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines?.map((line: any, idx: number) => (
                                    <tr key={idx} className="border-b border-black/20 text-center">
                                        <td className="border-r border-black/20 p-2 text-left">{line.product?.sku || 'Ref'}</td>
                                        <td className="border-r border-black/20 p-2 text-left">{line.product?.designation}</td>
                                        <td className="border-r border-black/20 p-2 text-right">{Number(line.unit_price).toLocaleString('fr-FR')}</td>
                                        <td className="border-r border-black/20 p-2">{line.quantity}</td>
                                        <td className="border-r border-black/20 p-2">pcs</td>
                                        <td className="border-r border-black/20 p-2">0</td>
                                        <td className="border-r border-black/20 p-2">0</td>
                                        <td className="p-2 text-right font-bold">{Number(line.total).toLocaleString('fr-FR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Section */}
                        <div className="flex justify-end mb-8">
                            <div className="w-[40%] border border-black text-xs">
                                <div className="flex justify-between p-2 border-b border-black bg-slate-50">
                                    <span className="font-bold">TOTAL HT</span>
                                    <span>{Number(invoice.total_ht).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-black">
                                    <span>REMISE</span>
                                    <span>0</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-black font-bold">
                                    <span>TOTAL HT APRES REMISE</span>
                                    <span>{Number(invoice.total_ht).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-black">
                                    <span>TVA (18%)</span>
                                    <span>0</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-black font-bold bg-slate-50 text-sm">
                                    <span>TOTAL TTC</span>
                                    <span>{Number(invoice.total_ttc).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-black">
                                    <span>AUTRES TAXES</span>
                                    <span>0</span>
                                </div>
                                <div className="flex justify-between p-2 font-bold text-sm bg-slate-100">
                                    <span>TOTAL A PAYER</span>
                                    <span>{Number(invoice.total_ttc).toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tax Summary (Hardcoded for now as logic is simple) */}
                        <div className="mb-8">
                            <h4 className="font-bold text-xs mb-1 uppercase border-b border-black pb-1">Résumé de la facture</h4>
                            <table className="w-full text-xs border border-black">
                                <thead className="bg-slate-50 border-b border-black font-bold">
                                    <tr>
                                        <td className="p-2 border-r border-black">CATEGORIE</td>
                                        <td className="p-2 border-r border-black text-right">SOUS-TOTAL</td>
                                        <td className="p-2 border-r border-black text-center">TAUX (%)</td>
                                        <td className="p-2 text-right">TOTAL TAXES</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-black/20">
                                        <td className="p-2 border-r border-black">Exonéré (A)</td>
                                        <td className="p-2 border-r border-black text-right">{Number(invoice.total_ht).toLocaleString('fr-FR')}</td>
                                        <td className="p-2 border-r border-black text-center">0%</td>
                                        <td className="p-2 text-right">0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-auto pt-8">
                            <p className="italic text-sm font-medium">{settings.company_slogan}</p>
                            <p className="text-[10px] text-slate-400 mt-2">Logiciel: CaissePro</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceA4;
