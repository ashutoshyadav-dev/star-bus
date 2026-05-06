export default function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition flex items-center justify-between">

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>

      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>

    </div>
  );
}