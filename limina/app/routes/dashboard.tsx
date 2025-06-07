import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  // Placeholder: fetch buy-orders and analytics here in the future
  return json({ buyOrders: [], analytics: {} });
};

export default function Dashboard() {
  // const { buyOrders, analytics } = useLoaderData<typeof loader>();
  return (
    <div style={{ padding: 32 }}>
      <h1>Merchant Dashboard</h1>
      <p>Welcome! Here you will see your buy-orders and analytics.</p>
      {/* Placeholder for buy-orders table and analytics */}
      <div style={{ marginTop: 32 }}>
        <h2>Buy Orders</h2>
        <p>No buy-orders yet.</p>
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>Analytics</h2>
        <p>Analytics will appear here.</p>
      </div>
    </div>
  );
} 