import { useEffect, useState } from "react";
import bookingsApi from "../../api/bookingsApi";
import stationsApi from "../../api/stationsApi";
import toast, { Toaster } from "react-hot-toast";

function Th({ children, className = "" }) { return <th className={`text-left font-medium px-4 py-3 border-b ${className}`}>{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }

export default function OperatorApprovals() {
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    try {
      const res = await stationsApi.list({});
      const items = Array.isArray(res) ? res : res.items ?? [];
      setStations(items);
      if (items.length) setStationId(items[0].id);
    } catch (e) { toast.error(e.message || "Failed to load stations"); }
  })(); }, []);

  useEffect(() => {
    if (!stationId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await bookingsApi.list({ status: "Pending", stationId, page:1, pageSize:50 });
        setRows(Array.isArray(data) ? data : data.items ?? []);
      } catch (e) { toast.error(e.message || "Failed to load bookings"); }
      finally { setLoading(false); }
    })();
  }, [stationId]);

  const approve = async (id) => {
    try {
      await bookingsApi.approve(id);
      toast.success("Booking approved");
      // refresh
      const data = await bookingsApi.list({ status: "Pending", stationId, page:1, pageSize:50 });
      setRows(Array.isArray(data) ? data : data.items ?? []);
    } catch (e) { toast.error(e.message || "Approve failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Pending Approvals</h1>
            <p className="text-xs text-gray-500">Approve bookings so owners can start charging.</p>
          </div>
          <select value={stationId} onChange={(e)=>setStationId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <Th>Owner</Th>
                <Th>NIC</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No pending bookings</td></tr>}
              {!loading && rows.map(b => (
                <tr key={b.id} className="bg-white/60">
                  <Td>{b.ownerName || "—"}</Td>
                  <Td>{b.ownerNic || "—"}</Td>
                  <Td>{new Date(b.startTime).toLocaleString()}</Td>
                  <Td>{new Date(b.endTime).toLocaleString()}</Td>
                  <Td className="text-right pr-4">
                    <button onClick={() => approve(b.id)} className="rounded-lg bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-600">
                      Approve
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
