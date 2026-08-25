import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function Ranking() {
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports/ranking')
            .then(res => setRankingData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="py-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Ranking de Productividad</h2>
                <p className="text-gray-500 text-sm mt-1">Cálculo de carga de trabajo ponderada en base a casos cerrados del mes actual.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabla Listado Ranking */}
                <div className="glass-panel p-6 lg:col-span-1 border border-gray-100 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500"></div>
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Top Peritos (Mes Actual)</h3>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rankingData.map((item: any, index: number) => (
                                <div key={item.perito_id} className="flex items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 transition-all hover:shadow-md hover:bg-white relative">
                                    {index === 0 && <span className="absolute -top-2 -right-2 text-2xl" title="Top Perito">🥇</span>}
                                    {index === 1 && <span className="absolute -top-2 -right-2 text-2xl">🥈</span>}
                                    {index === 2 && <span className="absolute -top-2 -right-2 text-2xl">🥉</span>}

                                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0">
                                        #{index + 1}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="font-bold text-gray-800 text-sm">{item.perito_nombre}</p>
                                        <p className="text-xs text-gray-500">
                                            {item.casos_cerrados} casos cerrados | Retraso: {item.porcentaje_retraso}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary-600 font-mono text-lg">{item.productividad_mensual.toFixed(1)}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Puntos</p>
                                    </div>
                                </div>
                            ))}
                            {rankingData.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No hay datos suficientes este mes.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Gráfico BarChart de Recharts */}
                <div className="glass-panel p-6 lg:col-span-2 border border-gray-100 shadow-lg">
                    <h3 className="font-bold text-lg mb-6 text-gray-800">Visualización de Productividad Relativa</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer>
                            <BarChart data={rankingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="perito_nombre" axisLine={false} tickLine={false} className="text-xs" />
                                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="productividad_mensual" name="Productividad (Pts)" fill="url(#colorProd)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
