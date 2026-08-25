import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridFilterModel } from '@mui/x-data-grid';
import { format } from 'date-fns';
import api from '../services/api';



export default function Users() {
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

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nombre_completo: '',
        departamento: 'La Paz',
        rol: 'PERITO'
    });

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'username', headerName: 'Usuario', width: 150 },
        { field: 'nombre_completo', headerName: 'Nombre Completo', width: 250 },
        {
            field: 'rol', headerName: 'Rol', width: 120,
            renderCell: (params) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${params.value === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {params.value}
                </span>
            )
        },
        { field: 'departamento', headerName: 'Dto.', width: 150 },
        {
            field: 'is_active', headerName: 'Estado', width: 100,
            renderCell: (params) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${params.value ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {params.value ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            field: 'created_at',
            headerName: 'Fecha Creación',
            width: 130,
            renderCell: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
        },
        {
            field: 'actions', headerName: 'Acciones', width: 130, sortable: false, flex: 1,
            renderCell: (params) => (
                <div className="flex items-center gap-1 h-full">
                    <button
                        onClick={() => handleEditClick(params.row)}
                        className="text-secondary-600 hover:text-secondary-800 p-1.5 rounded-lg hover:bg-secondary-50 transition-colors cursor-pointer"
                        title="Editar Usuario"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                        onClick={() => handleToggleStatus(params.row)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${params.row.is_active ? 'text-red-500 hover:bg-red-50 hover:text-red-700' : 'text-green-500 hover:bg-green-50 hover:text-green-700'}`}
                        title={params.row.is_active ? "Dar de baja" : "Dar de alta"}
                    >
                        {params.row.is_active ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </button>
                </div>
            )
        }
    ];

    const loadUsers = () => {
        setLoading(true);
        api.get('/users/')
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (user: any) => {
        setEditingUserId(user.id);
        setFormData({
            username: user.username,
            password: '',
            nombre_completo: user.nombre_completo,
            departamento: user.departamento,
            rol: user.rol
        });
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingUserId(null);
        setFormData({ username: '', password: '', nombre_completo: '', departamento: 'La Paz', rol: 'PERITO' });
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUserId) {
                const payload = { ...formData };
                await api.put(`/users/${editingUserId}`, payload);
            } else {
                await api.post('/users/', formData);
            }
            setIsModalOpen(false);
            setFormData({ username: '', password: '', nombre_completo: '', departamento: 'La Paz', rol: 'PERITO' });
            setEditingUserId(null);
            loadUsers(); // Recargar la tabla
        } catch (error: any) {
            console.error("Error al guardar usuario:", error);
            alert(error.response?.data?.detail || "Error al guardar usuario.");
        }
    };

    const handleToggleStatus = async (user: any) => {
        if (!window.confirm(`¿Estás seguro de que quieres ${user.is_active ? 'dar de baja' : 'dar de alta'} al usuario ${user.username}?`)) return;
        try {
            await api.put(`/users/${user.id}`, { is_active: !user.is_active });
            loadUsers();
        } catch (error: any) {
            console.error("Error al cambiar estado:", error);
            alert(error.response?.data?.detail || "Error al cambiar estado.");
        }
    };

    return (
        <div className="py-6 animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Peritos / Usuarios</h2>
                    <p className="text-gray-500 text-sm mt-1">Crea nuevas cuentas y asiga credenciales para que los peritos ingresen al sistema.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="cursor-pointer bg-gradient-to-r from-secondary-500 to-teal-600 hover:from-secondary-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-teal-200 transition-all text-sm flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    <span className="text-lg leading-none">+</span>
                    Nuevo Perito
                </button>
            </div>

            <div className="glass-panel min-h-[500px] w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <DataGrid
                    rows={users}
                    columns={columns}
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
                            <h3 className="text-lg font-bold text-gray-800">{editingUserId ? 'Editar Perito' : 'Registrar Nuevo Perito'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl leading-none cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario (Login)</label>
                                    <input required name="username" value={formData.username} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder="jperez" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
                                    <input required={!editingUserId} type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder={editingUserId ? "(Escriba para cambiar)" : "••••••••"} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo</label>
                                <input required name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none" placeholder="Juan Pérez Gómez" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                                    <select name="rol" value={formData.rol} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option value="PERITO">Perito Evaluador</option>
                                        <option value="ADMIN">Administrativo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Departamento</label>
                                    <select name="departamento" value={formData.departamento} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary-500 outline-none">
                                        <option>La Paz</option><option>Santa Cruz</option><option>Cochabamba</option><option>Oruro</option><option>Potosí</option><option>Tarija</option><option>Chuquisaca</option><option>Beni</option><option>Pando</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none cursor-pointer">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-secondary-500 text-white rounded-lg text-sm hover:bg-secondary-600 shadow-md focus:outline-none cursor-pointer">{editingUserId ? 'Guardar Cambios' : 'Registrar Usuario'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
