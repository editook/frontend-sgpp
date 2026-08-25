import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { format } from 'date-fns';
import api from '../services/api';

const isAdmin = localStorage.getItem('role') === 'ADMIN';

const columns: GridColDef[] = [
    { field: 'codigo_unico', headerName: 'Código', width: 130 },
    { field: 'nombre_completo', headerName: 'Perito Asignado', width: 200,renderCell: (params) =>{if(isAdmin){
        return params.row.perito?.nombre_completo;
    }return "Asignado"}},
    { field: 'nombre_evaluado', headerName: 'Evaluado', width: 220 },
    { field: 'sexo', headerName: 'Sexo', width: 100 },
    { field: 'edad', headerName: 'Edad', width: 80 },
    { field: 'tipo_delito', headerName: 'Delito', width: 170 },
    { field: 'sujeto_procesal', headerName: 'Sujeto Procesal', width: 150 },
    { field: 'departamento', headerName: 'Dto.', width: 110 },
    {
        field: 'tiene_consultor_tecnico',
        headerName: 'Cons. Técnico',
        width: 120,
        valueGetter: (params:Boolean) => params ? 'Sí' : 'No'
    },
    {
        field: 'fecha_requerimiento',
        headerName: 'Fecha Req.',
        width: 120,
        renderCell: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
    },
    { field: 'tipo_requerimiento', headerName: 'Tipo Req.', width: 130 },
    { field: 'estado_proceso', headerName: 'Estado Proceso', width: 160 },
    { field: 'estado_pericia', headerName: 'Estado Pericia', width: 180 },
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
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${params.value === 'Activo' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                {params.value}
            </span>
        )
    },
    // Adding Actions column dynamically inside the component to access state setters
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

    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editCaseId, setEditCaseId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState({
        estado_pericia: '',
        estado_pericia_fecha_programada: '',
        estado_pericia_detalle_representacion: '',
        estado_pericia_fecha_evaluacion: '',
        estado_pericia_tiempo_entrega: '',
        estado_pericia_fecha_entrega: '',
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

    const loadCases = () => {
        setLoading(true);
        
        
        api.get('/cases/')
            .then(res =>  setCases(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCases();
    }, []);

    const dynamicColumns: GridColDef[] = [
        ...columns,
        {
            field: 'acciones',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <button
                    onClick={() => {
                        setEditCaseId(params.row.id);
                        setEditFormData({
                            estado_pericia: params.row.estado_pericia || '',
                            estado_pericia_fecha_programada: params.row.estado_pericia_fecha_programada || '',
                            estado_pericia_detalle_representacion: params.row.estado_pericia_detalle_representacion || '',
                            estado_pericia_fecha_evaluacion: params.row.estado_pericia_fecha_evaluacion || '',
                            estado_pericia_tiempo_entrega: params.row.estado_pericia_tiempo_entrega || '',
                            estado_pericia_fecha_entrega: params.row.estado_pericia_fecha_entrega || '',
                        });
                        setIsEditModalOpen(true);
                    }}
                    className="text-primary-600 hover:text-primary-800 font-medium text-xs px-2 py-1 rounded bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                    Modificar Estado
                </button>
            )
        }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleUpdateEstado = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...editFormData };
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') payload[key] = null;
            });
            console.log(payload);
            await api.patch(`/cases/${editCaseId}/estado_pericia`, payload);
            setIsEditModalOpen(false);
            loadCases(); // Recargar la tabla
        } catch (error: any) {
            console.error("Error al actualizar estado:", error);
            alert("Error al actualizar el estado de la pericia.");
        }
    };

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...formData };
            // Convert empty strings to null for optional dates and numbers
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
            loadCases(); // Recargar la tabla
        } catch (error: any) {
            console.error("Error al crear caso:", error);
            if (error.response) {
                console.error("Detalle del error:", error.response.data);
                alert(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                alert("Error al crear caso. Asegúrese de ser Admin y tener los IDs correctos (Ej: Perito ID=1).");
            }
        }
    };

    return (
        <div className="py-6 animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Panel de Registro y Filtrado</h2>
                    <p className="text-gray-500 text-sm mt-1">Busque, filtre y exporte a CSV instantáneamente.</p>
                </div>
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
                    }}
                    pageSizeOptions={[5, 10, 15, 25, 50]}
                    disableRowSelectionOnClick
                    className="border-none"
                    sx={{
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid #f3f4f6' },
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' },
                        '& .MuiDataGrid-toolbarContainer': { padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' },
                    }}
                />
            </div>

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Registrar Nuevo Caso</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreateCase} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del perito</label>
                                    <input disabled value={localStorage.getItem('userName') || 'S/N'} className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none text-gray-500 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">CUD / Código Único</label>
                                    <input required name="codigo_unico" value={formData.codigo_unico} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder="CASO-2026-X" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de requerimiento</label>
                                    <input type="date" name="fecha_requerimiento" value={formData.fecha_requerimiento} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de requerimiento</label>
                                    <select name="tipo_requerimiento" value={formData.tipo_requerimiento} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="">Seleccione</option>
                                        <option value="Judicial">Judicial</option>
                                        <option value="Fiscal">Fiscal</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado del proceso</label>
                                    <select name="estado_proceso" value={formData.estado_proceso} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="">Seleccione</option>
                                        <option value="Etapa preliminar">Etapa preliminar</option>
                                        <option value="Etapa preparatoria">Etapa preparatoria</option>
                                        <option value="Juicio">Juicio</option>
                                    </select>
                                </div>
                            </div>

                            {formData.estado_proceso === 'Juicio' && (
                                <div className="mt-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Detalle de Juicio</label>
                                    <input type="text" name="estado_proceso_detalle" value={formData.estado_proceso_detalle} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder="..." />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado de la pericia</label>
                                    <select name="estado_pericia" value={formData.estado_pericia} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="">Seleccione</option>
                                        <option value="Se programo">Se programo</option>
                                        <option value="Se represento">Se represento</option>
                                        <option value="Se evaluó">Se evaluó</option>
                                        <option value="En proceso de elaboracion">En proceso de elaboracion</option>
                                        <option value="Entregado">Entregado</option>
                                    </select>
                                </div>
                                <div>
                                    {formData.estado_pericia === 'Se programo' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha programada</label>
                                            <input type="date" name="estado_pericia_fecha_programada" value={formData.estado_pericia_fecha_programada} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                    {formData.estado_pericia === 'Se represento' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Detalle de representación</label>
                                            <input type="text" name="estado_pericia_detalle_representacion" value={formData.estado_pericia_detalle_representacion} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                    {formData.estado_pericia === 'Se evaluó' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de evaluación</label>
                                            <input type="date" name="estado_pericia_fecha_evaluacion" value={formData.estado_pericia_fecha_evaluacion} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                    {formData.estado_pericia === 'En proceso de elaboracion' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tiempo de entrega</label>
                                            <input type="text" name="estado_pericia_tiempo_entrega" value={formData.estado_pericia_tiempo_entrega} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                    {formData.estado_pericia === 'Entregado' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de entrega</label>
                                            <input type="date" name="estado_pericia_fecha_entrega" value={formData.estado_pericia_fecha_entrega} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sujeto procesal</label>
                                    <select name="sujeto_procesal" value={formData.sujeto_procesal} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="">Seleccione</option>
                                        <option value="Victima">Victima</option>
                                        <option value="Imputado">Imputado</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    {formData.sujeto_procesal === 'Otro' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Detalle</label>
                                            <input type="text" name="sujeto_procesal_detalle" value={formData.sujeto_procesal_detalle} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Delito</label>
                                    <select required name="tipo_delito" value={formData.tipo_delito} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="">Seleccione</option>
                                        <option value="Delitos contra la libertad sexual">Delitos contra la libertad sexual</option>
                                        <option value="Violencia domestica e intrafamiliar">Violencia domestica e intrafamiliar</option>
                                        <option value="Homicidio - Suicidio">Homicidio - Suicidio</option>
                                        <option value="Lesiones graves y leves">Lesiones graves y leves</option>
                                        <option value="Trata de personas - Pornografia">Trata de personas - Pornografía</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    {formData.tipo_delito === 'Otro' && (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Especifique</label>
                                            <input type="text" name="tipo_delito_detalle" value={formData.tipo_delito_detalle} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Evaluado</label>
                                    <input required name="nombre_evaluado" value={formData.nombre_evaluado} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder="Juan Pérez" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Sexo</label>
                                        <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                            <option value="">-</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="LGTBI">LGTBI</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Edad</label>
                                        <input type="number" name="edad" value={formData.edad} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Dto.</label>
                                    <select name="departamento" value={formData.departamento} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option>La Paz</option><option>Santa Cruz</option><option>Cochabamba</option><option>Oruro</option><option>Potosí</option><option>Tarija</option><option>Chuquisaca</option><option>Beni</option><option>Pando</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">¿Cons. Técnico?</label>
                                    <select name="tiene_consultor_tecnico" value={formData.tiene_consultor_tecnico ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, tiene_consultor_tecnico: e.target.value === 'true' })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="false">No</option>
                                        <option value="true">Sí</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none cursor-pointer">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 shadow-md focus:outline-none cursor-pointer">Registrar Caso</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal de Edición de Estado Pericia */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Modificar Estado Pericia</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateEstado} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado de la pericia</label>
                                <select name="estado_pericia" value={editFormData.estado_pericia} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                    <option value="">Seleccione</option>
                                    <option value="Se programo">Se programo</option>
                                    <option value="Se represento">Se represento</option>
                                    <option value="Se evaluó">Se evaluó</option>
                                    <option value="En proceso de elaboracion">En proceso de elaboracion</option>
                                    <option value="Entregado">Entregado</option>
                                </select>
                            </div>

                            {editFormData.estado_pericia === 'Se programo' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha programada</label>
                                    <input type="date" name="estado_pericia_fecha_programada" value={editFormData.estado_pericia_fecha_programada} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                </div>
                            )}
                            {editFormData.estado_pericia === 'Se represento' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Detalle de representación</label>
                                    <input type="text" name="estado_pericia_detalle_representacion" value={editFormData.estado_pericia_detalle_representacion} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                </div>
                            )}
                            {editFormData.estado_pericia === 'Se evaluó' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de evaluación</label>
                                    <input type="date" name="estado_pericia_fecha_evaluacion" value={editFormData.estado_pericia_fecha_evaluacion} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                </div>
                            )}
                            {editFormData.estado_pericia === 'En proceso de elaboracion' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tiempo de entrega</label>
                                    <input type="text" name="estado_pericia_tiempo_entrega" value={editFormData.estado_pericia_tiempo_entrega} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder="Ej: 5 días" />
                                </div>
                            )}
                            {editFormData.estado_pericia === 'Entregado' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de entrega</label>
                                    <input type="date" name="estado_pericia_fecha_entrega" value={editFormData.estado_pericia_fecha_entrega} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none cursor-pointer">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 shadow-md focus:outline-none cursor-pointer">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
