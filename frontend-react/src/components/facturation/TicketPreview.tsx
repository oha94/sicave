import React, { useRef } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Printer, X, Check } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';

interface TicketPreviewProps {
    cart: any[];
    client: any;
    totalHT: number;
    totalTTC: number;
    onClose: () => void;
    onValidate: () => void;
    isSubmitting: boolean;
    invoice?: any; // Optional full invoice object for DGI info
}

const TicketPreview: React.FC<TicketPreviewProps> = ({ cart, client, totalHT, totalTTC, onClose, onValidate, isSubmitting, invoice }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Ticket-${invoice?.reference || Date.now()}`,
        onAfterPrint: () => onValidate && onValidate()
    });

    // Check for DGI info (from invoice object passed)
    const dgiUrl = invoice?.dgi_qr_url;
    const dgiReference = invoice?.dgi_reference;
    const dgiToken = invoice?.dgi_token; // Top-level token or invoice.dgi_token? From DB columns.
    const dgiSynced = !!dgiReference;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-sm max-h-[90vh] flex flex-col bg-white shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Printer size={18} className="text-primary" /> Aperçu du Ticket
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Ticket Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                    <div ref={componentRef} className="text-center font-mono text-sm space-y-4 text-slate-800 p-2 printable-content">

                        {/* Header Info */}
                        <div>
                            {dgiSynced && <div className="font-bold text-xs uppercase mb-1">Facture Normalisée</div>}
                            <div className="font-bold text-lg uppercase tracking-wider">SICAVE</div>
                            <div>Tel: +229 00 00 00 00</div>
                            <div className="text-xs text-slate-500">{new Date(invoice?.created_at || Date.now()).toLocaleString()}</div>
                            {invoice?.reference && <div className="text-xs font-bold mt-1">Ref: {invoice.reference}</div>}
                        </div>

                        <div className="border-b border-t border-dashed border-slate-300 py-2">
                            <div className="flex justify-between font-bold">
                                <span>Designation</span>
                                <span>Total</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex flex-col text-left">
                                    <span>{item.designation || item.product?.designation}</span>
                                    <div className="flex justify-between text-xs text-slate-600 pl-2">
                                        <span>{item.quantity} x {Number(item.price || item.unit_price).toLocaleString()}</span>
                                        <span className="font-bold text-slate-800">{Number((item.quantity * (item.price || item.unit_price))).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                            <div className="flex justify-between">
                                <span>Total HT</span>
                                <span>{totalHT.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-1 border-t border-slate-200">
                                <span>NET A PAYER</span>
                                <span>{totalTTC.toLocaleString()} F</span>
                            </div>
                        </div>

                        <div className="text-xs pt-4 space-y-2">
                            <div>Client: {client?.nom || invoice?.client?.nom || 'Client Comptoir'}</div>

                            {/* DGI QR Code Section */}
                            {dgiSynced && (
                                <div className="mt-4 pt-2 border-t border-dotted border-slate-300 flex flex-col items-center gap-2">
                                    <div className="font-bold text-xs">Code MECeF/DGI</div>
                                    <div className="bg-white p-1 border border-slate-100">
                                        <QRCodeSVG value={dgiUrl || 'https://dgi.bj'} size={128} />
                                    </div>
                                    <div className="text-[10px] break-all px-4 text-center text-slate-500">
                                        MECeF NIM: {dgiReference} <br />
                                        Signature: {dgiToken}
                                    </div>
                                </div>
                            )}

                            <div className="mt-2 text-slate-500">Merci de votre visite !</div>
                            <div className="italic text-[10px] text-slate-400">Logiciel: CaissePro v1.0</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className="btn-secondary py-3 justify-center"
                        disabled={isSubmitting}
                    >
                        Fermer
                    </button>
                    {/* Only show Validate if we are in SUBMIT mode (not viewing history) 
                        Note: onValidate is passed. If viewing history, handlePrint can be called differently or button renamed "Imprimer"
                    */}
                    <button
                        onClick={() => handlePrint && handlePrint()}
                        className="btn-primary py-3 justify-center shadow-lg shadow-primary/20"
                        disabled={isSubmitting}
                    >
                        <span className="flex items-center gap-2"><Printer size={18} /> Imprimer</span>
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default TicketPreview;
