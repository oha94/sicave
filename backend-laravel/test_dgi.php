$inv = App\Models\Invoice::find('a0fbcd88-001b-45e8-9d1d-25d22282cec2');
if ($inv) {
echo "Found invoice: " . $inv->reference . "\n";
$svc = new App\Services\DgiService();
try {
$svc->reportInvoice($inv);
echo "Success: Reported\n";
} catch (\Exception $e) {
echo "Error: " . $e->getMessage() . "\n";
}
} else {
echo "Invoice not found\n";
}