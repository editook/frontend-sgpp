import { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import api from '../services/api';
import { Activity, Clock, CheckCircle, Package } from 'lucide-react';

// Usamos el geojson descargado localmente desde geoBoundaries.org con corrección de winding (d3-geo)
const boliviaGeoJSON = `${import.meta.env.BASE_URL}/bolivia_fixed.geojson`;

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const MAP_COLORS = ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca'];

const DEP_CENTERS: Record<string, [number, number]> = {
    "beni": [-65.5, -14.0],
    "chuquisaca": [-64.5, -20.0],
    "cochabamba": [-65.5, -17.5],
    "la paz": [-68.0, -15.0],
    "oruro": [-67.5, -18.5],
    "pando": [-67.0, -11.0],
    "potosi": [-66.5, -20.5],
    "santa cruz": [-61.5, -17.0],
    "tarija": [-63.5, -21.5]
};

export default function Statistics() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/statistics/')
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading || !stats) {
        return <div className="p-8 text-center text-gray-500">Cargando métricas...</div>;
    }

    // Calcular escala de colores para el mapa interactivo
    const colorScale = scaleQuantile<string>()
        .domain(stats.por_departamento.map((d: any) => d.value))
        .range(MAP_COLORS);

    const totalCasesMap = stats.por_departamento.reduce((acc: number, curr: any) => acc + curr.value, 0);

    return (
        <div className="py-6 animate-fade-in space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Estadísticas y Análisis</h2>
                <p className="text-gray-500 text-sm mt-1">Supervisión en tiempo real del desempeño de casos a nivel nacional.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total de Casos</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.kpis.total}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Package size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Casos Activos</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-1">{stats.kpis.activos}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Activity size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Casos Cerrados</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">{stats.kpis.cerrados}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Con Retraso</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-1">{stats.kpis.con_retraso}</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Principal Charts Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Mapa de Calor de Bolivia (Toma 2 columnas) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Densidad de Casos por Departamento</h3>
                    <div className="h-[400px] flex justify-center items-center bg-gray-50/50 rounded-xl">
                        <ComposableMap
                            projection="geoMercator"
                            width={600}
                            height={800}
                            projectionConfig={{ scale: 3200, center: [-64, -16.5] }}
                            style={{ width: "100%", height: "100%" }}
                        >
                            <Geographies geography={boliviaGeoJSON}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        // geoBoundaries utiliza "shapeName" para referirse al departamento
                                        const geoName = geo.properties.shapeName || geo.properties.name || '';
                                        const d = stats.por_departamento.find((s: any) =>
                                            s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === geoName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                        );
                                        const color = d ? colorScale(d.value) : "#cbd5e1"; // color gris por defecto si no hay casos

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={color}
                                                stroke="#FFFFFF"
                                                strokeWidth={1.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: "#6366f1", outline: "none", cursor: 'pointer', opacity: 0.9 },
                                                    pressed: { outline: "none" }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                            {/* Layer for percentage text */}
                            <Geographies geography={boliviaGeoJSON}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const geoName = geo.properties.shapeName || geo.properties.name || '';
                                        const normalizedName = geoName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                        const d = stats.por_departamento.find((s: any) =>
                                            s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedName
                                        );
                                        const center = DEP_CENTERS[normalizedName];
                                        const percentage = d && totalCasesMap > 0 ? ((d.value / totalCasesMap) * 100).toFixed(0) + "%" : "0%";

                                        if (!center) return null;

                                        return (
                                            <Marker key={`${geo.rsmKey}-marker`} coordinates={center}>
                                                <text textAnchor="middle" y={5} fill="#FFFFFF" fontSize="16" fontWeight="bold" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.5)' }}>
                                                    {percentage}
                                                </text>
                                            </Marker>
                                        );
                                    })
                                }
                            </Geographies>
                        </ComposableMap>
                    </div>
                </div>

                {/* Donut Chart: Tipo de Delitos */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top Delitos</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.por_delito}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.por_delito.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => [value, 'Casos']} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Secction 2: Timeline and Peritos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Line Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Ingreso Histórico de Casos (Timeline)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.timeline} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <RechartsTooltip
                                    cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="cantidad" name="Casos" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Casos por Perito Bar Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Casos por Perito</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.por_perito} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 12 }} width={80} />
                                <RechartsTooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" name="Casos asignados" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                                    {stats.por_perito?.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}
