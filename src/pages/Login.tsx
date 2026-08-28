import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Credenciales incorrectas o servidor inaccesible');
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background elements abstractos simulando la referencia */}
            <div className="absolute top-0 right-0 w-full h-full bg-[url(`${import.meta.env.BASE_URL}bg-abstract-lines.svg`)] opacity-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] w-full max-w-5xl h-auto md:h-[550px] overflow-hidden relative z-10">

                {/* Left Side - Form */}
                <div className="w-full md:w-5/12 p-8 md:p-14 flex flex-col justify-center bg-white relative z-20">
                    <h2 className="text-3xl font-extrabold text-[#1a1b36] tracking-tight mb-4">
                        Iniciar Sesión
                    </h2>
                    <p className="text-sm font-semibold text-gray-600 mb-8">
                        Bienvenido a SGPP
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-500 p-2 rounded text-xs text-center font-medium">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </span>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4c6bf4] focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                                placeholder="Usuario o email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-10 pr-11 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4c6bf4] focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#4c6bf4] transition-colors cursor-pointer p-1 rounded focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="flex justify-end pt-1">
                            <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}
                                className="text-xs font-semibold text-[#4c6bf4] hover:underline"
                            >
                                ¿Olvidó su contraseña?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-[#516cf0] hover:bg-[#435bcf] text-white font-medium rounded-lg transition-colors shadow-md shadow-[#516cf0]/30 mt-2 text-sm"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>

                {/* Right Side - Illustration with Wavy Border */}
                <div className="hidden md:block md:w-7/12 relative bg-[#d6e4ff] overflow-hidden">
                    {/* SVG Curve overlay dividing white and blue sections */}
                    <div className="absolute left-0 top-0 h-full w-24 text-white z-20 pointer-events-none drop-shadow-[5px_0_10px_rgba(0,0,0,0.05)]">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current">
                            <path d="M0,0 Q60,20 50,50 T100,100 L0,100 Z" />
                        </svg>
                    </div>

                    {/* Logo IDIF movido dentro de la tarjeta, esquina superior derecha y más grande */}
                    <div className="absolute top-8 right-8 z-30">
                        <img src={`${import.meta.env.BASE_URL}idif-logo-transparent.png`} alt="IDIF" className="h-28 w-auto object-contain drop-shadow-lg filter mix-blend-multiply opacity-95" />
                    </div>

                    {/* Contenido Visual */}
                    <div className="absolute inset-0 flex items-center justify-center p-8 z-10 pl-20">
                        <img src={`${import.meta.env.BASE_URL}login_illustration.png`}
                            
                            alt="Plataforma Pericial"
                            className="w-full max-w-lg h-auto object-contain mix-blend-multiply"
                        />
                    </div>
                </div>
            </div>

            {/* Modal de Olvido de Contraseña */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <svg className="h-6 w-6 text-[#516cf0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#1a1b36] mb-2">Restablecer Contraseña</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Por favor comuníquese con el administrador del sistema para restablecer su contraseña.
                        </p>
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="w-full py-2.5 px-4 bg-[#516cf0] hover:bg-[#435bcf] text-white font-medium rounded-lg transition-colors cursor-pointer"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
