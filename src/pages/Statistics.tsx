import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import api from '../services/api';
import { Activity, Clock, CheckCircle, Package, Users } from 'lucide-react';

// Usamos el geojson optimizado localmente
const boliviaGeoJSON = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/bolivia_fixed.geojson?v=3`;

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6'];
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
        return (
            <div className="flex items-center justify-center p-16 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
                <span>Cargando métricas y estadísticas...</span>
            </div>
        );
    }

    // Calcular escala de colores para el mapa interactivo
    const colorScale = scaleQuantile<string>()
        .domain(stats.por_departamento.map((d: any) => d.value))
        .range(MAP_COLORS);

    const totalCasesMap = stats.por_departamento.reduce((acc: number, curr: any) => acc + curr.value, 0);

    // Ordenar peritos de mayor a menor según cantidad de casos
    const sortedPeritos = [...(stats.por_perito || [])].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

    const getDepColor = (val?: number) => {
        if (!val || val === 0) return "#e2e8f0";
        return colorScale(val);
    };

    return (
        <div className="py-6 animate-fade-in space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Estadísticas y Análisis</h2>
                <p className="text-gray-500 text-sm mt-1">Supervisión en tiempo real del desempeño de casos a nivel nacional.</p>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total de Casos</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.kpis.total}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Package size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Casos Activos</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-1">{stats.kpis.activos}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Activity size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Casos Cerrados</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">{stats.kpis.cerrados}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Con Retraso</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-1">{stats.kpis.con_retraso}</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Fila 1: Mapa de Bolivia y Top Delitos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mapa de Calor de Bolivia (2 columnas) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Densidad de Casos por Departamento</h3>
                            <p className="text-xs text-gray-500">Distribución geográfica a nivel nacional</p>
                        </div>
                    </div>
                    <div className="h-[380px] flex justify-center items-center bg-gray-50/50 rounded-xl">
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
                                        const geoName = geo.properties.shapeName || geo.properties.name || '';
                                        const d = stats.por_departamento.find((s: any) =>
                                            s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === geoName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                        );
                                        const color = getDepColor(d?.value);

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={color}
                                                stroke="#FFFFFF"
                                                strokeWidth={1.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: "#4f46e5", outline: "none", cursor: 'pointer', opacity: 0.9 },
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

                {/* Donut Chart: Tipo de Delitos (1 columna) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Top Delitos</h3>
                    <p className="text-xs text-gray-500 mb-4">Clasificación por tipo de caso</p>
                    <div className="h-[340px] grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.por_delito}
                                    cx="50%"
                                    cy="48%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.por_delito.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => [value, 'Casos']} />
                                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Fila 2: Distribución de Casos por Perito (Gráfica Completa Ordenada de Mayor a Menor) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Distribución de Casos por Perito</h3>
                            <p className="text-xs text-gray-500">Casos asignados organizados de mayor a menor</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full self-start sm:self-auto">
                        {sortedPeritos.length} {sortedPeritos.length === 1 ? 'Perito' : 'Peritos'}
                    </span>
                </div>

                <div className="w-full h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={sortedPeritos} 
                            layout="vertical" 
                            margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748B', fontSize: 12 }} 
                                allowDecimals={false}
                            />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#1E293B', fontSize: 13, fontWeight: 600 }} 
                                width={180} 
                            />
                            <RechartsTooltip
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value} caso(s)`, 'Casos Asignados']}
                            />
                            <Bar 
                                dataKey="value" 
                                name="Casos asignados" 
                                radius={[0, 8, 8, 0]} 
                                barSize={28}
                            >
                                {sortedPeritos.map((_entry: any, index: number) => (
                                    <Cell key={`cell-perito-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
