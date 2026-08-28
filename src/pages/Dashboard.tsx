import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import api from '../services/api';

const isAdmin = localStorage.getItem('role') === 'ADMIN';

// Capitaliza la primera letra de cada palabra para nombres propios (ej: "Carlos Eduardo Pérez")
const formatProperName = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/(^|\s+)([a-záéíóúñ])/gi, (_, space, char) => space + char.toUpperCase());
};

// Formatea texto cualitativo/descriptivo: primera letra mayúscula y todo el resto en minúsculas (ej: "Lesiones leves en brazo")
const formatQualitativeText = (text: string): string => {
    if (!text) return '';
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const getCaseOrderPriority = (estadoPericia?: string): number => {
    const ep = (estadoPericia || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // 1. En la parte superior: Se programó
    if (ep === 'se programo') return 1;
    
    // 2. En proceso de elaboración
    if (ep === 'en proceso de elaboracion') return 2;
    
    // 3. Otros / Sin registrar
    if (!ep) return 3;
    if (ep !== 'se represento' && ep !== 'entregado') return 3;
    
    // 4. Se representó (hacia abajo)
    if (ep === 'se represento') return 4;
    
    // 5. Entregado (en la parte más abajo de todas)
    if (ep === 'entregado') return 5;

    return 6;
};

const columns: GridColDef[] = [
    { field: 'codigo_unico', headerName: 'Código', width: 130 },
    { field: 'nombre_completo', headerName: 'Perito Asignado', width: 200, renderCell: (params) => {
        if (isAdmin) {
            return params.row.perito?.nombre_completo;
        }
        return "Asignado";
    }},
    { field: 'nombre_evaluado', headerName: 'Evaluado', width: 220 },
    { field: 'sexo', headerName: 'Género', width: 110 },
    { field: 'edad', headerName: 'Edad', width: 80 },
    { field: 'tipo_delito', headerName: 'Delito', width: 170 },
    { field: 'sujeto_procesal', headerName: 'Sujeto Procesal', width: 150 },
    { field: 'departamento', headerName: 'Dto.', width: 110 },
    {
        field: 'tiene_consultor_tecnico',
        headerName: 'Cons. Técnico',
        width: 120,
        valueGetter: (params: Boolean) => params ? 'Sí' : 'No'
    },
    {
        field: 'fecha_requerimiento',
        headerName: 'Fecha Req.',
        width: 120,
        renderCell: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
    },
    { field: 'tipo_requerimiento', headerName: 'Tipo Req.', width: 130 },
    { field: 'estado_proceso', headerName: 'Estado Proceso', width: 160 },
    {
        field: 'estado_pericia',
        headerName: 'Estado Pericia',
        width: 190,
        sortComparator: (v1: any, v2: any) => getCaseOrderPriority(v1) - getCaseOrderPriority(v2),
        renderCell: (params) => {
            const val = params.value || '';
            const normalized = val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';

            if (normalized === 'se programo') {
                badgeStyle = 'bg-blue-100 text-blue-700 border-blue-200';
            } else if (normalized === 'se evaluo') {
                badgeStyle = 'bg-purple-100 text-purple-700 border-purple-200';
            } else if (normalized === 'en proceso de elaboracion') {
                badgeStyle = 'bg-amber-100 text-amber-700 border-amber-200';
            } else if (normalized === 'se represento') {
                badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
            } else if (normalized === 'entregado') {
                badgeStyle = 'bg-emerald-100 text-emerald-700 border-emerald-200';
            }

            return (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                    {val || '-'}
                </span>
            );
        }
    },
    {
        field: 'estado_pericia_fecha_programada',
        headerName: 'Fecha Prog.',
        width: 120,
        renderCell: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
    },
    {
        field: 'estado_pericia_fecha_evaluacion',
        headerName: 'Fecha Eval.',
        width: 120,
        renderCell: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
    },
    {
        field: 'estado_pericia_fecha_entrega',
        headerName: 'Fecha Entrega',
        width: 130,
        renderCell: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
    },
    {
        field: 'estado',
        headerName: 'Estado General',
        width: 130,
        renderCell: (params) => (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                params.value === 'Activo' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
                {params.value}
            </span>
        )
    },
];

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const globalSearchQuery = searchParams.get('q') || '';

    const [filterModel, setFilterModel] = useState<GridFilterModel>({
        items: [],
        quickFilterValues: [],
    });

    useEffect(() => {
        setFilterModel((prev) => ({
            ...prev,
            quickFilterValues: globalSearchQuery ? globalSearchQuery.trim().split(/\s+/) : [],
        }));
    }, [globalSearchQuery]);

    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editCaseId, setEditCaseId] = useState<number | null>(null);

    const [editFormData, setEditFormData] = useState({
        codigo_unico: '',
        nombre_evaluado: '',
        tipo_delito: '',
        tipo_delito_detalle: '',
        sujeto_procesal: '',
        sujeto_procesal_detalle: '',
        sexo: '',
        edad: '',
        departamento: 'La Paz',
        tiene_consultor_tecnico: false,
        fecha_requerimiento: '',
        tipo_requerimiento: '',
        estado_proceso: '',
        estado_proceso_detalle: '',
        estado_pericia: '',
        estado_pericia_fecha_programada: '',
        estado_pericia_detalle_representacion: '',
        estado_pericia_fecha_evaluacion: '',
        estado_pericia_tiempo_entrega: '',
        estado_pericia_fecha_entrega: '',
    });

    const [cudWarning, setCudWarning] = useState<{
        exists: boolean;
        exactMatch: string | null;
        evaluado: string | null;
        similarMatches: Array<{ codigo_unico: string; evaluado: string }>;
    }>({
        exists: false,
        exactMatch: null,
        evaluado: null,
        similarMatches: []
    });

    const [formData, setFormData] = useState({
        codigo_unico: '',
        nombre_evaluado: '',
        tipo_delito: '',
        coeficiente_id: 1,
        perito_id: Number(localStorage.getItem('userId')) || 1,
        departamento: 'La Paz',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        plazo_dias: 10,
        fecha_requerimiento: '',
        tipo_requerimiento: '',
        estado_proceso: '',
        estado_proceso_detalle: '',
        estado_pericia: '',
        estado_pericia_fecha_programada: '',
        estado_pericia_detalle_representacion: '',
        estado_pericia_fecha_evaluacion: '',
        estado_pericia_tiempo_entrega: '',
        estado_pericia_fecha_entrega: '',
        sujeto_procesal: '',
        sujeto_procesal_detalle: '',
        tipo_delito_detalle: '',
        sexo: '',
        edad: '',
        tiene_consultor_tecnico: false
    });

    // Validación en tiempo real de CUD duplicado o similar al crear
    useEffect(() => {
        const val = (formData.codigo_unico || '').trim();
        if (!val || val.length < 2) {
            setCudWarning({ exists: false, exactMatch: null, evaluado: null, similarMatches: [] });
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/cases/check-cud?cud=${encodeURIComponent(val)}`);
                const data = res.data;
                const exact = data.exact_match;
                const exactItem = data.matches?.find((m: any) => m.codigo_unico.toLowerCase() === val.toLowerCase());
                const similar = data.matches?.filter((m: any) => m.codigo_unico.toLowerCase() !== val.toLowerCase()) || [];

                setCudWarning({
                    exists: data.exists,
                    exactMatch: exact || null,
                    evaluado: exactItem ? exactItem.evaluado : (data.matches?.[0]?.evaluado || null),
                    similarMatches: similar
                });
            } catch (err) {
                const exact = cases.find(c => (c.codigo_unico || '').toLowerCase() === val.toLowerCase());
                const similar = cases.filter(c => (c.codigo_unico || '').toLowerCase().includes(val.toLowerCase()) && (c.codigo_unico || '').toLowerCase() !== val.toLowerCase()).slice(0, 3);
                setCudWarning({
                    exists: !!exact,
                    exactMatch: exact ? exact.codigo_unico : null,
                    evaluado: exact ? exact.nombre_evaluado : null,
                    similarMatches: similar.map(s => ({ codigo_unico: s.codigo_unico, evaluado: s.nombre_evaluado }))
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.codigo_unico, cases]);

    const loadCases = () => {
        setLoading(true);
        api.get('/cases/')
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                const sorted = [...list].sort((a: any, b: any) => {
                    const pA = getCaseOrderPriority(a.estado_pericia);
                    const pB = getCaseOrderPriority(b.estado_pericia);
                    if (pA !== pB) return pA - pB;
                    return (b.id || 0) - (a.id || 0);
                });
                setCases(sorted);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCases();
    }, []);

    const duplicateCuds = useMemo(() => {
        const counts = new Map<string, number>();
        cases.forEach(c => {
            if (c.codigo_unico) {
                const cud = c.codigo_unico.trim().toLowerCase();
                counts.set(cud, (counts.get(cud) || 0) + 1);
            }
        });
        const duplicates = new Set<string>();
        counts.forEach((count, cud) => {
            if (count > 1) duplicates.add(cud);
        });
        return duplicates;
    }, [cases]);

    const dynamicColumns: GridColDef[] = [
        ...columns.map(col => {
            if (col.field === 'codigo_unico') {
                return {
                    ...col,
                    renderCell: (params: any) => {
                        const cud = (params.value || '').trim().toLowerCase();
                        if (duplicateCuds.has(cud)) {
                            return <span className="text-red-600 font-bold px-1.5 py-0.5 bg-red-50 rounded border border-red-200" title="CUD Duplicado">{params.value}</span>;
                        }
                        return <span>{params.value}</span>;
                    }
                };
            }
            return col;
        }),
        {
            field: 'acciones',
            headerName: 'Acciones',
            width: 140,
            sortable: false,
            renderCell: (params) => {
                const currentUserId = Number(localStorage.getItem('userId'));
                const isOwner = params.row.perito_id === currentUserId || isAdmin;

                if (!isOwner) {
                    return (
                        <span 
                            title="Bloqueado: Solo el perito asignado puede modificar este caso"
                            className="text-gray-400 text-xs px-2.5 py-1 rounded bg-gray-100 border border-gray-200 cursor-not-allowed inline-flex items-center gap-1 font-medium select-none"
                        >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Bloqueado
                        </span>
                    );
                }

                return (
                    <button
                        onClick={() => {
                            setEditCaseId(params.row.id);
                            setEditFormData({
                                codigo_unico: params.row.codigo_unico || '',
                                nombre_evaluado: params.row.nombre_evaluado || '',
                                tipo_delito: params.row.tipo_delito || '',
                                tipo_delito_detalle: params.row.tipo_delito_detalle || '',
                                sujeto_procesal: params.row.sujeto_procesal || '',
                                sujeto_procesal_detalle: params.row.sujeto_procesal_detalle || '',
                                sexo: params.row.sexo || '',
                                edad: params.row.edad !== null && params.row.edad !== undefined ? String(params.row.edad) : '',
                                departamento: params.row.departamento || 'La Paz',
                                tiene_consultor_tecnico: params.row.tiene_consultor_tecnico || false,
                                fecha_requerimiento: params.row.fecha_requerimiento || '',
                                tipo_requerimiento: params.row.tipo_requerimiento || '',
                                estado_proceso: params.row.estado_proceso || '',
                                estado_proceso_detalle: params.row.estado_proceso_detalle || '',
                                estado_pericia: params.row.estado_pericia || '',
                                estado_pericia_fecha_programada: params.row.estado_pericia_fecha_programada || '',
                                estado_pericia_detalle_representacion: params.row.estado_pericia_detalle_representacion || '',
                                estado_pericia_fecha_evaluacion: params.row.estado_pericia_fecha_evaluacion || '',
                                estado_pericia_tiempo_entrega: params.row.estado_pericia_tiempo_entrega || '',
                                estado_pericia_fecha_entrega: params.row.estado_pericia_fecha_entrega || '',
                            });
                            setIsEditModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-800 font-medium text-xs px-2.5 py-1 rounded-md bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer border border-primary-100 flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modificar Caso
                    </button>
                );
            }
        }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'nombre_evaluado') {
            formattedValue = formatProperName(value);
        } else if ([
            'estado_proceso_detalle',
            'estado_pericia_detalle_representacion',
            'sujeto_procesal_detalle',
            'tipo_delito_detalle',
            'estado_pericia_tiempo_entrega'
        ].includes(name)) {
            formattedValue = formatQualitativeText(value);
        }

        setFormData({ ...formData, [name]: formattedValue });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'nombre_evaluado') {
            formattedValue = formatProperName(value);
        } else if ([
            'estado_proceso_detalle',
            'estado_pericia_detalle_representacion',
            'sujeto_procesal_detalle',
            'tipo_delito_detalle',
            'estado_pericia_tiempo_entrega'
        ].includes(name)) {
            formattedValue = formatQualitativeText(value);
        }

        setEditFormData({ ...editFormData, [name]: formattedValue });
    };

    const handleExportExcel = () => {
        if (!cases || cases.length === 0) {
            alert('No hay casos disponibles para exportar.');
            return;
        }

        const excelData = cases.map((c: any, index: number) => ({
            'N°': index + 1,
            'Código Único (CUD)': c.codigo_unico || '',
            'Perito Asignado': c.perito?.nombre_completo || 'Sin asignar',
            'Evaluado': c.nombre_evaluado || '',
            'Género': c.sexo || '',
            'Edad': c.edad ?? '',
            'Tipo Delito': c.tipo_delito || '',
            'Detalle Delito': c.tipo_delito_detalle || '',
            'Sujeto Procesal': c.sujeto_procesal || '',
            'Detalle Sujeto': c.sujeto_procesal_detalle || '',
            'Departamento': c.departamento || '',
            'Consultor Técnico': c.tiene_consultor_tecnico ? 'Sí' : 'No',
            'Fecha Requerimiento': c.fecha_requerimiento ? format(new Date(c.fecha_requerimiento), 'dd/MM/yyyy') : '',
            'Tipo Requerimiento': c.tipo_requerimiento || '',
            'Estado Proceso': c.estado_proceso || '',
            'Detalle Proceso': c.estado_proceso_detalle || '',
            'Estado Pericia': c.estado_pericia || '',
            'Fecha Programada': c.estado_pericia_fecha_programada ? format(new Date(c.estado_pericia_fecha_programada), 'dd/MM/yyyy') : '',
            'Detalle Representación': c.estado_pericia_detalle_representacion || '',
            'Fecha Evaluación': c.estado_pericia_fecha_evaluacion ? format(new Date(c.estado_pericia_fecha_evaluacion), 'dd/MM/yyyy') : '',
            'Tiempo Entrega': c.estado_pericia_tiempo_entrega || '',
            'Fecha Entrega': c.estado_pericia_fecha_entrega ? format(new Date(c.estado_pericia_fecha_entrega), 'dd/MM/yyyy') : '',
            'Estado General': c.estado || '',
            'Fecha Ingreso': c.fecha_ingreso ? format(new Date(c.fecha_ingreso), 'dd/MM/yyyy') : ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        const colWidths = Object.keys(excelData[0] || {}).map(key => {
            const maxLen = Math.max(
                key.length,
                ...excelData.map((row: any) => String(row[key] || '').length)
            );
            return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Casos');

        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd_HHmm');
        XLSX.writeFile(workbook, `SGPP_Casos_${dateStr}.xlsx`);
    };

    const handleUpdateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...editFormData };
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') payload[key] = null;
            });
            if (payload.edad) payload.edad = Number(payload.edad);

            await api.put(`/cases/${editCaseId}`, payload);
            setIsEditModalOpen(false);
            loadCases();
        } catch (error: any) {
            console.error("Error al actualizar caso:", error);
            const msg = error.response?.data?.detail || "Error al actualizar los datos del caso.";
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        // Se permite registrar aunque el CUD ya exista (cudWarning.exists)
        try {
            const payload: any = { ...formData };
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') {
                    payload[key] = null;
                }
            });
            
            await api.post('/cases/', {
                ...payload,
                coeficiente_id: Number(formData.coeficiente_id),
                perito_id: Number(formData.perito_id),
                plazo_dias: Number(formData.plazo_dias),
                edad: formData.edad ? Number(formData.edad) : null
            });
            setIsModalOpen(false);
            setFormData({
                codigo_unico: '',
                nombre_evaluado: '',
                tipo_delito: '',
                coeficiente_id: 1,
                perito_id: Number(localStorage.getItem('userId')) || 1,
                departamento: 'La Paz',
                fecha_ingreso: new Date().toISOString().split('T')[0],
                plazo_dias: 10,
                fecha_requerimiento: '',
                tipo_requerimiento: '',
                estado_proceso: '',
                estado_proceso_detalle: '',
                estado_pericia: '',
                estado_pericia_fecha_programada: '',
                estado_pericia_detalle_representacion: '',
                estado_pericia_fecha_evaluacion: '',
                estado_pericia_tiempo_entrega: '',
                estado_pericia_fecha_entrega: '',
                sujeto_procesal: '',
                sujeto_procesal_detalle: '',
                tipo_delito_detalle: '',
                sexo: '',
                edad: '',
                tiene_consultor_tecnico: false
            });
            loadCases();
        } catch (error: any) {
            console.error("Error al crear caso:", error);
            const msg = error.response?.data?.detail || "Error al crear caso. Asegúrese de que los datos sean correctos.";
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    return (
        <div className="py-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Panel de Registro y Filtrado</h2>
                    <p className="text-gray-500 text-sm mt-1">Busque, filtre y exporte sus casos periciales.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-medium shadow-md shadow-emerald-100 transition-all text-sm flex items-center gap-2 transform hover:-translate-y-0.5"
                        title="Descargar datos en formato Excel (.xlsx)"
                    >
                        <svg className="w-4 h-4 text-emerald-100" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10.5-8.5-2.2 3.5 2.2 3.5h-1.6l-1.4-2.4-1.4 2.4H10.5l2.2-3.5-2.2-3.5h1.6l1.4 2.4 1.4-2.4h1.6z"/>
                        </svg>
                        Exportar Excel
                    </button>
                    <button
                        onClick={() => {
                            setFormData({
                                codigo_unico: '',
                                nombre_evaluado: '',
                                tipo_delito: '',
                                coeficiente_id: 1,
                                perito_id: Number(localStorage.getItem('userId')) || 1,
                                departamento: 'La Paz',
                                fecha_ingreso: new Date().toISOString().split('T')[0],
                                plazo_dias: 10,
                                fecha_requerimiento: '',
                                tipo_requerimiento: '',
                                estado_proceso: '',
                                estado_proceso_detalle: '',
                                estado_pericia: '',
                                estado_pericia_fecha_programada: '',
                                estado_pericia_detalle_representacion: '',
                                estado_pericia_fecha_evaluacion: '',
                                estado_pericia_tiempo_entrega: '',
                                estado_pericia_fecha_entrega: '',
                                sujeto_procesal: '',
                                sujeto_procesal_detalle: '',
                                tipo_delito_detalle: '',
                                sexo: '',
                                edad: '',
                                tiene_consultor_tecnico: false
                            });
                            setIsModalOpen(true);
                        }}
                        className="cursor-pointer bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-200 transition-all text-sm flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <span className="text-lg leading-none">+</span>
                        Crear Caso
                    </button>
                </div>
            </div>

            <div className="glass-panel min-h-[500px] w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <DataGrid
                    rows={cases}
                    columns={dynamicColumns}
                    loading={loading}
                    autoHeight
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 50 },
                        },
                    }}
                    filterModel={filterModel}
                    onFilterModelChange={(newModel) => setFilterModel(newModel)}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 15 } },
                        sorting: {
                            sortModel: [{ field: 'estado_pericia', sort: 'asc' }],
                        },
                    }}
                    pageSizeOptions={[5, 10, 15, 25, 50]}
                    disableRowSelectionOnClick
                    className="border-none"
                    sx={{
                        '& .MuiDataGrid-cell': {
                            display: 'flex',
                            alignItems: 'center',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: '600',
                            color: '#4b5563',
                        }
                    }}
                />
            </div>

            {/* Modal de Creación - Formato Cuaderno Oficio */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden animate-fade-in my-6 max-h-[94vh] flex flex-col border border-gray-200">
                        {/* Header tipo Cuaderno Oficio */}
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-100 border-b border-gray-200 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-gray-800 tracking-tight">Registrar Nuevo Caso</h3>
                                <p className="text-xs text-gray-500">Formulario de registro pericial</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="w-7 h-7 rounded-full bg-white hover:bg-red-100 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm font-bold text-base cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Form Body vertical */}
                        <form onSubmit={handleCreateCase} className="p-6 space-y-3.5 overflow-y-auto grow">
                            {/* Fila 1: Perito y Código */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Perito</label>
                                    <input 
                                        disabled 
                                        value={localStorage.getItem('userName') || 'S/N'} 
                                        className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-600 cursor-not-allowed" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">CUD / Código Único <span className="text-red-500">*</span></label>
                                    <input 
                                        required 
                                        name="codigo_unico" 
                                        value={formData.codigo_unico} 
                                        onChange={handleChange} 
                                        className={`w-full border rounded-lg px-3 py-1.5 text-xs outline-none shadow-sm transition-colors ${
                                            cudWarning.exists 
                                                ? 'border-amber-500 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-400' 
                                                : cudWarning.similarMatches.length > 0 
                                                ? 'border-amber-400 bg-amber-50/40 focus:ring-2 focus:ring-amber-400'
                                                : 'border-gray-300 focus:ring-2 focus:ring-primary-500'
                                        }`}
                                        placeholder="CASO-2026-X" 
                                    />
                                </div>
                            </div>

                            {/* Alerta de CUD Duplicado o Similar */}
                            {cudWarning.exists && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs flex items-start gap-2">
                                    <span className="text-base leading-none">⚠️</span>
                                    <div>
                                        <p className="font-bold">¡Este CUD ya está registrado!</p>
                                        <p className="mt-0.5 text-amber-700">
                                            Ya existe un caso con el código <strong>{cudWarning.exactMatch}</strong>
                                            {cudWarning.evaluado ? ` (${cudWarning.evaluado})` : ''}. 
                                            <em> (Puedes continuar si corresponde a otra persona evaluada)</em>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!cudWarning.exists && cudWarning.similarMatches.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs flex items-start gap-2">
                                    <span className="text-base leading-none">ℹ️</span>
                                    <div>
                                        <p className="font-semibold">CUDs similares ya registrados:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {cudWarning.similarMatches.map((m, idx) => (
                                                <span key={idx} className="bg-amber-100/80 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded text-[11px]">
                                                    <strong>{m.codigo_unico}</strong> ({m.evaluado})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fila 2: Requerimiento */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha requerimiento</label>
                                    <input 
                                        type="date" 
                                        name="fecha_requerimiento" 
                                        value={formData.fecha_requerimiento} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo requerimiento</label>
                                    <select 
                                        name="tipo_requerimiento" 
                                        value={formData.tipo_requerimiento} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Judicial">Judicial</option>
                                        <option value="Fiscal">Fiscal</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fila 3: Estado del proceso */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado del proceso</label>
                                <select 
                                    name="estado_proceso" 
                                    value={formData.estado_proceso} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Etapa preliminar">Etapa preliminar</option>
                                    <option value="Etapa preparatoria">Etapa preparatoria</option>
                                    <option value="Juicio">Juicio</option>
                                </select>
                                {formData.estado_proceso === 'Juicio' && (
                                    <input 
                                        type="text" 
                                        name="estado_proceso_detalle" 
                                        value={formData.estado_proceso_detalle} 
                                        onChange={handleChange} 
                                        className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                        placeholder="Detalle de Juicio..." 
                                    />
                                )}
                            </div>

                            {/* Fila 4: Estado de la Pericia */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Estado de la pericia</label>
                                    <select 
                                        name="estado_pericia" 
                                        value={formData.estado_pericia} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium text-gray-800"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Se programo">Se programo</option>
                                        <option value="Se represento">Se represento</option>
                                        <option value="En proceso de elaboracion">En proceso de elaboracion</option>
                                        <option value="Entregado">Entregado</option>
                                    </select>
                                </div>

                                {formData.estado_pericia === 'Se programo' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha programada</label>
                                        <input 
                                            type="date" 
                                            name="estado_pericia_fecha_programada" 
                                            value={formData.estado_pericia_fecha_programada} 
                                            onChange={handleChange} 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                        />
                                    </div>
                                )}

                                {formData.estado_pericia === 'Se represento' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Detalle de representación</label>
                                        <input 
                                            type="text" 
                                            name="estado_pericia_detalle_representacion" 
                                            value={formData.estado_pericia_detalle_representacion} 
                                            onChange={handleChange} 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                            placeholder="Motivo de la representación..." 
                                        />
                                    </div>
                                )}

                                {formData.estado_pericia === 'En proceso de elaboracion' && (
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha evaluación</label>
                                            <input 
                                                type="date" 
                                                name="estado_pericia_fecha_evaluacion" 
                                                value={formData.estado_pericia_fecha_evaluacion} 
                                                onChange={handleChange} 
                                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tiempo entrega</label>
                                            <input 
                                                type="text" 
                                                name="estado_pericia_tiempo_entrega" 
                                                value={formData.estado_pericia_tiempo_entrega} 
                                                onChange={handleChange} 
                                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                                placeholder="Ej: 5 días" 
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.estado_pericia === 'Entregado' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de entrega</label>
                                        <input 
                                            type="date" 
                                            name="estado_pericia_fecha_entrega" 
                                            value={formData.estado_pericia_fecha_entrega} 
                                            onChange={handleChange} 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Fila 5: Sujeto Procesal y Tipo Delito */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sujeto procesal</label>
                                    <select 
                                        name="sujeto_procesal" 
                                        value={formData.sujeto_procesal} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Victima">Victima</option>
                                        <option value="Imputado">Imputado</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    {formData.sujeto_procesal === 'Otro' && (
                                        <input 
                                            type="text" 
                                            name="sujeto_procesal_detalle" 
                                            value={formData.sujeto_procesal_detalle} 
                                            onChange={handleChange} 
                                            className="w-full mt-1.5 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                            placeholder="Detalle..." 
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Delito <span className="text-red-500">*</span></label>
                                    <select 
                                        required 
                                        name="tipo_delito" 
                                        value={formData.tipo_delito} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Delitos contra la libertad sexual">Delitos contra la libertad sexual</option>
                                        <option value="Violencia domestica e intrafamiliar">Violencia domestica e intrafamiliar</option>
                                        <option value="Homicidio - Suicidio">Homicidio - Suicidio</option>
                                        <option value="Lesiones graves y leves">Lesiones graves y leves</option>
                                        <option value="Trata de personas - Pornografia">Trata de personas - Pornografía</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    {formData.tipo_delito === 'Otro' && (
                                        <input 
                                            type="text" 
                                            name="tipo_delito_detalle" 
                                            value={formData.tipo_delito_detalle} 
                                            onChange={handleChange} 
                                            className="w-full mt-1.5 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                            placeholder="Especifique..." 
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Fila 6: Nombre Evaluado */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Evaluado <span className="text-red-500">*</span></label>
                                <input 
                                    required 
                                    name="nombre_evaluado" 
                                    value={formData.nombre_evaluado} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                    placeholder="Ej: Juan Pérez" 
                                />
                            </div>

                            {/* Fila 7: Género y Edad */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Género</label>
                                    <select 
                                        name="sexo" 
                                        value={formData.sexo} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">-</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="LGTBI">LGTBI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Edad</label>
                                    <input 
                                        type="number" 
                                        name="edad" 
                                        value={formData.edad} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                        placeholder="Años"
                                    />
                                </div>
                            </div>

                            {/* Fila 8: Ubicación y Consultor */}
                            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-gray-100">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Departamento</label>
                                    <select 
                                        name="departamento" 
                                        value={formData.departamento} 
                                        onChange={handleChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option>La Paz</option>
                                        <option>Santa Cruz</option>
                                        <option>Cochabamba</option>
                                        <option>Oruro</option>
                                        <option>Potosí</option>
                                        <option>Tarija</option>
                                        <option>Chuquisaca</option>
                                        <option>Beni</option>
                                        <option>Pando</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">¿Cons. Técnico?</label>
                                    <select 
                                        name="tiene_consultor_tecnico" 
                                        value={formData.tiene_consultor_tecnico ? 'true' : 'false'} 
                                        onChange={(e) => setFormData({ ...formData, tiene_consultor_tecnico: e.target.value === 'true' })} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="false">No</option>
                                        <option value="true">Sí</option>
                                    </select>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-xs shadow transition-all cursor-pointer"
                                >
                                    Registrar Caso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edición Completa del Caso - Formato Cuaderno Oficio */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden animate-fade-in my-6 max-h-[94vh] flex flex-col border border-gray-200">
                        {/* Header tipo Cuaderno Oficio */}
                        <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-indigo-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-gray-800 tracking-tight">Modificar Datos del Caso</h3>
                                <p className="text-xs text-gray-500">Actualizar información y estado del caso</p>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="w-7 h-7 rounded-full bg-white hover:bg-red-100 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm font-bold text-base cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Form Body vertical */}
                        <form onSubmit={handleUpdateCase} className="p-6 space-y-3.5 overflow-y-auto grow">
                            {/* Fila 1: CUD */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">CUD / Código Único <span className="text-red-500">*</span></label>
                                <input 
                                    required 
                                    name="codigo_unico" 
                                    value={editFormData.codigo_unico} 
                                    onChange={handleEditChange} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none shadow-sm" 
                                    placeholder="CASO-2026-X" 
                                />
                            </div>

                            {/* Fila 2: Requerimiento */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha requerimiento</label>
                                    <input 
                                        type="date" 
                                        name="fecha_requerimiento" 
                                        value={editFormData.fecha_requerimiento} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo requerimiento</label>
                                    <select 
                                        name="tipo_requerimiento" 
                                        value={editFormData.tipo_requerimiento} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Judicial">Judicial</option>
                                        <option value="Fiscal">Fiscal</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fila 3: Estado del proceso */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado del proceso</label>
                                <select 
                                    name="estado_proceso" 
                                    value={editFormData.estado_proceso} 
                                    onChange={handleEditChange} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Etapa preliminar">Etapa preliminar</option>
                                    <option value="Etapa preparatoria">Etapa preparatoria</option>
                                    <option value="Juicio">Juicio</option>
                                </select>
                                {editFormData.estado_proceso === 'Juicio' && (
                                    <input 
                                        type="text" 
                                        name="estado_proceso_detalle" 
                                        value={editFormData.estado_proceso_detalle} 
                                        onChange={handleEditChange} 
                                        className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                        placeholder="Detalle de Juicio..." 
                                    />
                                )}
                            </div>

                            {/* Fila 4: Estado de la Pericia */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Estado de la pericia</label>
                                    <select 
                                        name="estado_pericia" 
                                        value={editFormData.estado_pericia} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium text-gray-800"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Se programo">Se programo</option>
                                        <option value="Se represento">Se represento</option>
                                        <option value="En proceso de elaboracion">En proceso de elaboracion</option>
                                        <option value="Entregado">Entregado</option>
                                    </select>
                                </div>

                                {editFormData.estado_pericia === 'Se programo' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha programada</label>
                                        <input 
                                            type="date" 
                                            name="estado_pericia_fecha_programada" 
                                            value={editFormData.estado_pericia_fecha_programada} 
                                            onChange={handleEditChange} 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                        />
                                    </div>
                                )}

                                {editFormData.estado_pericia === 'Se represento' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Detalle de representación</label>
                                        <input 
                                            type="text" 
                                            name="estado_pericia_detalle_representacion" 
                                            value={editFormData.estado_pericia_detalle_representacion} 
                                            onChange={handleEditChange} 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                            placeholder="Motivo de la representación..." 
                                        />
                                    </div>
                                )}

                                {editFormData.estado_pericia === 'En proceso de elaboracion' && (
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha evaluación</label>
                                            <input 
                                                type="date" 
                                                name="estado_pericia_fecha_evaluacion" 
                                                value={editFormData.estado_pericia_fecha_evaluacion} 
                                                onChange={handleEditChange} 
                                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tiempo entrega</label>
                                            <input 
                                                type="text" 
                                                name="estado_pericia_tiempo_entrega" 
                                                value={editFormData.estado_pericia_tiempo_entrega} 
                                                onChange={handleEditChange} 
                                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                                placeholder="Ej: 5 días" 
                                            />
                                        </div>
                                    </div>
                                )}

                                {editFormData.estado_pericia === 'Entregado' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de entrega</label>
                                        <input 
                                            type="date" 
                                            name="estado_pericia_fecha_entrega" 
                                            value={editFormData.estado_pericia_fecha_entrega} 
                                            onChange={handleEditChange} 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white" 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Fila 5: Sujeto Procesal y Tipo Delito */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sujeto procesal</label>
                                    <select 
                                        name="sujeto_procesal" 
                                        value={editFormData.sujeto_procesal} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Victima">Victima</option>
                                        <option value="Imputado">Imputado</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    {editFormData.sujeto_procesal === 'Otro' && (
                                        <input 
                                            type="text" 
                                            name="sujeto_procesal_detalle" 
                                            value={editFormData.sujeto_procesal_detalle} 
                                            onChange={handleEditChange} 
                                            className="w-full mt-1.5 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                            placeholder="Detalle..." 
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Delito <span className="text-red-500">*</span></label>
                                    <select 
                                        required 
                                        name="tipo_delito" 
                                        value={editFormData.tipo_delito} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="Delitos contra la libertad sexual">Delitos contra la libertad sexual</option>
                                        <option value="Violencia domestica e intrafamiliar">Violencia domestica e intrafamiliar</option>
                                        <option value="Homicidio - Suicidio">Homicidio - Suicidio</option>
                                        <option value="Lesiones graves y leves">Lesiones graves y leves</option>
                                        <option value="Trata de personas - Pornografia">Trata de personas - Pornografía</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    {editFormData.tipo_delito === 'Otro' && (
                                        <input 
                                            type="text" 
                                            name="tipo_delito_detalle" 
                                            value={editFormData.tipo_delito_detalle} 
                                            onChange={handleEditChange} 
                                            className="w-full mt-1.5 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                            placeholder="Especifique..." 
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Fila 6: Nombre Evaluado */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Evaluado <span className="text-red-500">*</span></label>
                                <input 
                                    required 
                                    name="nombre_evaluado" 
                                    value={editFormData.nombre_evaluado} 
                                    onChange={handleEditChange} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                    placeholder="Ej: Juan Pérez" 
                                />
                            </div>

                            {/* Fila 7: Género y Edad */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Género</label>
                                    <select 
                                        name="sexo" 
                                        value={editFormData.sexo} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="">-</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="LGTBI">LGTBI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Edad</label>
                                    <input 
                                        type="number" 
                                        name="edad" 
                                        value={editFormData.edad} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none" 
                                        placeholder="Años"
                                    />
                                </div>
                            </div>

                            {/* Fila 8: Ubicación y Consultor */}
                            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-gray-100">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Departamento</label>
                                    <select 
                                        name="departamento" 
                                        value={editFormData.departamento} 
                                        onChange={handleEditChange} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option>La Paz</option>
                                        <option>Santa Cruz</option>
                                        <option>Cochabamba</option>
                                        <option>Oruro</option>
                                        <option>Potosí</option>
                                        <option>Tarija</option>
                                        <option>Chuquisaca</option>
                                        <option>Beni</option>
                                        <option>Pando</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">¿Cons. Técnico?</label>
                                    <select 
                                        name="tiene_consultor_tecnico" 
                                        value={editFormData.tiene_consultor_tecnico ? 'true' : 'false'} 
                                        onChange={(e) => setEditFormData({ ...editFormData, tiene_consultor_tecnico: e.target.value === 'true' })} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="false">No</option>
                                        <option value="true">Sí</option>
                                    </select>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-xs shadow transition-all cursor-pointer"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
