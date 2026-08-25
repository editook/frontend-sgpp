import { useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, BarChart2, Users, LogOut } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { logout } = useAuth();
    const [avatar, setAvatar] = useState<string | null>(localStorage.getItem('user_avatar'));

    const searchQuery = searchParams.get('q') || '';

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            setSearchParams({ q: value });
        } else {
            setSearchParams({});
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 150;
                canvas.width = size;
                canvas.height = size;

                // Escalar la imagen manteniendo proporciones ("object-fit: cover" manual)
                const scale = Math.max(size / img.width, size / img.height);
                const x = (size - img.width * scale) / 2;
                const y = (size - img.height * scale) / 2;

                ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setAvatar(dataUrl);
                localStorage.setItem('user_avatar', dataUrl); // Persistir en el navegador
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const getLinkStyle = (path: string) => {
        const isActive = location.pathname.startsWith(path);
        return isActive
            ? "flex items-center gap-4 px-4 py-3 bg-gray-50 text-indigo-700 rounded-l-full font-bold ml-4"
            : "flex items-center gap-4 px-4 py-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-l-full font-medium ml-4 transition-colors";
    };

    const getIconStyle = (path: string) => {
        return location.pathname.startsWith(path) ? "text-indigo-700" : "text-indigo-200";
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
            {/* Sidebar Personalizado */}
            <aside className="w-72 bg-[#4a5f9e] flex flex-col hidden md:flex z-20 shadow-xl relative text-white rounded-r-2xl pb-4">
                <div className="p-8 pb-4">
                    <div className="flex flex-col items-center justify-center text-center w-full">
                        <div className="flex items-center justify-center tracking-tighter w-full" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                            <span className="font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-200">
                                IDIF
                            </span>
                            <span className="font-black text-4xl text-white ml-2">
                                BOLIVIA
                            </span>
                        </div>

                        <div className="flex flex-col items-end w-full pr-1 mt-2.5" style={{ fontFamily: '"Outfit", "Poppins", sans-serif' }}>
                            <p className="text-[9px] text-white font-bold tracking-[0.15em] uppercase">
                                Instituto de Investigación Forense
                            </p>
                            <p className="text-[8.5px] text-cyan-300 font-semibold tracking-[0.2em] uppercase mt-0.5">
                                Psicología Forense
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 mt-8 space-y-2 overflow-hidden flex flex-col pr-0">
                    <Link to="/dashboard" className={getLinkStyle('/dashboard')}>
                        <LayoutDashboard size={20} className={getIconStyle('/dashboard')} /> Casos
                    </Link>
                    {localStorage.getItem('role') === 'ADMIN' && (
                        <>
                            <Link to="/statistics" className={getLinkStyle('/statistics')}>
                                <BarChart2 size={20} className={getIconStyle('/statistics')} /> Estadísticas
                            </Link>
                            <Link to="/users" className={getLinkStyle('/users')}>
                                <Users size={20} className={getIconStyle('/users')} /> Peritos
                            </Link>
                        </>
                    )}
                </nav>

                <div className="pl-4 pr-0 border-t border-indigo-500/30 pt-4 mt-auto">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-l-full font-medium transition-colors cursor-pointer"
                    >
                        <LogOut size={20} className="text-indigo-300" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header Placeholder */}
                <header className="h-20 bg-transparent flex items-center justify-between px-8 z-10">
                    <div className="w-1/3">
                        {!location.pathname.startsWith('/statistics') && (
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder={location.pathname.startsWith('/users') ? "Buscar perito por nombre o apellido..." : "Buscar caso por nombre o CUD..."}
                                className="w-full bg-white border border-gray-100 rounded-full py-2.5 px-6 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer relative group flex items-center justify-center outline-none">
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            {avatar ? (
                                <img src={avatar} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" title="Actualizar foto">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                        </label>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 px-8 pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
