import { useState } from "react";
import bookingsApi from "../../api/bookingsApi";
import toast, { Toaster } from "react-hot-toast";

export default function OperatorScan() {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.scan(code); // expects { booking:{...}, valid:true }
      setBooking(res.booking || res);
      toast.success("QR valid");
    } catch (e) {
      setBooking(null);
      toast.error(e.message || "Invalid QR");
    } finally { setLoading(false); }
  };

  const finalize = async () => {
    try {
      await bookingsApi.finalize(booking.id);
      toast.success("Session finalized");
      setBooking(null);
      setCode("");
    } catch (e) {
      toast.error(e.message || "Finalize failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-4">Scan & Finalize</h1>

        <div className="rounded-2xl border bg-white p-6 mb-6">
          <label className="block text-sm font-medium mb-1">QR code (paste or type)</label>
          <input value={code} onChange={(e)=>setCode(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="qr-payload…" />
          <div className="mt-3">
            <button onClick={validate} disabled={!code || loading} className="rounded-lg bg-emerald-700 text-white px-4 py-2 disabled:opacity-60">
              {loading ? "Validating…" : "Validate"}
            </button>
          </div>
        </div>

        {booking && (
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="font-semibold mb-2">Booking</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="text-gray-500">Owner:</span> {booking.ownerName || "—"} ({booking.ownerNic})</div>
              <div><span className="text-gray-500">Station:</span> {booking.stationName || booking.stationId}</div>
              <div><span className="text-gray-500">Start:</span> {new Date(booking.startTime).toLocaleString()}</div>
              <div><span className="text-gray-500">End:</span> {new Date(booking.endTime).toLocaleString()}</div>
              <div><span className="text-gray-500">Status:</span> {booking.status}</div>
            </div>
            <div className="mt-4">
              <button onClick={finalize} className="rounded-lg bg-gray-900 text-white px-4 py-2 hover:bg-black">Finalize</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
