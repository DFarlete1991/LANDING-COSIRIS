import { useRef } from 'react';
import {
	motion,
	useScroll,
	useTransform,
	useSpring,
	useMotionTemplate,
} from 'framer-motion';
import { History, Zap, ArrowRight, Minus, ChevronRight, ChevronDown } from 'lucide-react';
import { useUI } from '@/context/UIContext';

export default function EvolutionSection() {
	const containerRef = useRef<HTMLElement | null>(null);
	const { openContactModal } = useUI();

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start start', 'end end'],
	});

	const smoothProgress = useSpring(scrollYProgress, {
		stiffness: 60,
		damping: 25,
		restDelta: 0.001,
	});

	const lineY = useTransform(smoothProgress, [0, 1], ['0%', '100%']);
	const clipBottom = useTransform(smoothProgress, [0, 1], [100, 0]);
	const clipPath = useMotionTemplate`inset(0% 0% ${clipBottom}% 0%)`;

	return (
		<section ref={containerRef} className="relative h-[600vh] bg-[#ffffff]">
			<div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
				<div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
					<svg
						viewBox="0 0 100 150"
						preserveAspectRatio="none"
						className="absolute inset-0 h-full w-full opacity-40"
					>
						<line
							x1="50" y1="0" x2="50" y2="150"
							fill="none"
							stroke="#CBD5E1"
							strokeWidth="0.5"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>

					<motion.svg
						viewBox="0 0 100 150"
						preserveAspectRatio="none"
						className="absolute inset-0 h-full w-full"
						style={{
							clipPath,
							opacity: useTransform(smoothProgress, [0, 0.01, 0.99, 1], [0, 1, 1, 0]),
						}}
					>
						<line
							x1="50" y1="0" x2="50" y2="150"
							fill="none"
							stroke="url(#lineGradient)"
							strokeWidth="1"
							vectorEffect="non-scaling-stroke"
						/>
						<defs>
							<linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" stopColor="#FF8000" />
								<stop offset="100%" stopColor="#FF4D00" />
							</linearGradient>
						</defs>
					</motion.svg>

					<motion.div
						className="absolute z-20 -ml-2.5 -mt-2.5 h-5 w-5 rounded-full border-4 border-[#FF8000] bg-white shadow-[0_0_20px_#FF8000]"
						style={{
							left: '50%',
							top: lineY,
							opacity: useTransform(smoothProgress, [0, 0.01, 0.99, 1], [0, 1, 1, 0]),
						}}
					/>
				</div>

				<motion.div
					style={{
						opacity: useTransform(smoothProgress, [0.02, 0.10], [1, 0]),
						y: useTransform(smoothProgress, [0.02, 0.10], [0, -50]),
					}}
					className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
				>
					<h2 className="mb-6 text-5xl font-light tracking-tighter text-slate-900 md:text-8xl leading-[1.1]">
						Historia y Evolución <br />
						<span className="font-serif italic text-[#FF8000]">del Sector Inmobiliario</span>
					</h2>
					<p className="mx-auto max-w-lg text-sm font-light leading-relaxed text-slate-500 md:text-base">
						Los métodos tradicionales de publicidad del  sector inmobiliario ahora  han pasado a través de una pantalla.
Mejorando tu presencia local.
					</p>
				</motion.div>

				<motion.div 
					animate={{ y: [0, 10, 0] }}
					transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
					style={{
						opacity: useTransform(smoothProgress, [0.02, 0.05, 0.95, 1], [0, 1, 1, 0]),
					}}
					className="absolute bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none"
				>
					<ChevronDown className="h-8 w-8 text-[#FF8000] opacity-60" />
				</motion.div>

				<motion.div
					style={{
						opacity: useTransform(smoothProgress, [0.08, 0.15, 0.25, 0.32], [0, 1, 1, 0]),
						y: useTransform(smoothProgress, [0.08, 0.15, 0.25, 0.32], [100, 0, -20, -100]),
					}}
					className="absolute bottom-0 right-6 top-0 z-20 flex w-[85%] flex-col justify-center md:right-24 md:w-[42%]"
				>
					<div className="mb-2 inline-block text-6xl font-black italic tracking-tighter text-slate-200 md:text-8xl">
						1990
					</div>
					<div className="mb-8 flex items-center gap-3">
						<History className="text-slate-400" size={24} strokeWidth={1.5} />
						<h3 className="text-2xl font-medium tracking-tight text-slate-800 md:text-3xl">
							Métodos Tradicionales
						</h3>
					</div>
					<ul className="space-y-6 md:space-y-4">
						{[
							{
								t: 'Revista',
								d: 'Venta a través de una revista física en papel.',
							},
							{
								t: 'Escaparate',
								d: 'Captación a través de tu escaparate estático.',
							},
							{
								t: 'Buzoneo',
								d: 'Reparto masivo por viviendas sin segmentar.',
							},
							{
								t: 'Puerta Fría',
								d: 'Contactar puerta a puerta insistiendo físicamente.',
							},
						].map((item, index) => (
							<li key={index} className="group border-l-2 border-slate-200 pl-5">
								<p className="text-sm font-bold uppercase tracking-wider text-slate-800">
									{item.t}
								</p>
								<p className="mt-1.5 text-sm font-light leading-relaxed text-slate-500">
									{item.d}
								</p>
							</li>
						))}
					</ul>
				</motion.div>

				<motion.div
					style={{
						opacity: useTransform(smoothProgress, [0.25, 0.32, 0.45, 0.52], [0, 1, 1, 0]),
						y: useTransform(smoothProgress, [0.25, 0.32, 0.45, 0.52], [100, 0, -20, -100]),
					}}
					className="absolute bottom-0 left-6 top-0 z-20 flex w-[85%] flex-col justify-center md:left-24 md:w-[42%]"
				>
					<div className="mb-2 inline-block text-6xl font-black italic tracking-tighter text-slate-200 md:text-8xl">
						2000
					</div>
					<div className="mb-8 flex items-center gap-3">
						<Minus className="text-slate-400" size={24} strokeWidth={1.5} />
						<h3 className="text-2xl font-medium tracking-tight text-slate-800 md:text-3xl">
							Primera etapa digital
						</h3>
					</div>
					<p className="mb-4 text-base font-light leading-relaxed text-slate-500">
						Inicio de la primera etapa de la digitalización (se fundan los portales).
					</p>
					<p className="mb-4 text-base font-light leading-relaxed text-slate-500">
						Nacimiento de los portales inmobiliarios y momento en auge del sector 
						inmobiliario dónde la obra nueva y la compra venta no hace más que crecer.
					</p>
				</motion.div>

				<motion.div
					style={{
						opacity: useTransform(smoothProgress, [0.45, 0.52, 0.65, 0.72], [0, 1, 1, 0]),
						y: useTransform(smoothProgress, [0.45, 0.52, 0.65, 0.72], [100, 0, -20, -100]),
					}}
					className="absolute bottom-0 right-6 top-0 z-20 flex w-[85%] flex-col justify-center md:right-24 md:w-[42%]"
				>
					<div className="mb-2 inline-block text-6xl font-black italic tracking-tighter text-slate-200 md:text-8xl">
						2010
					</div>
					<div className="mb-8 flex items-center gap-3">
						<Minus className="text-slate-400" size={24} strokeWidth={1.5} />
						<h3 className="text-2xl font-medium tracking-tight text-slate-800 md:text-3xl">
							Crisis Inmobiliaria
						</h3>
					</div>
					<ul className="list-disc pl-5 space-y-3 mb-8 text-base font-light leading-relaxed text-slate-500">
						<li>Crisis financiera / inmobiliaria.</li>
						<li>Momento de mercado de más propiedades que compradores.</li>
						<li>El 70% de las inmobiliarias empiezan a vender a través de portales.</li>
						<li>Encontrando compradores de manera remota a través de internet.</li>
					</ul>
				</motion.div>

				<motion.div
					style={{
						opacity: useTransform(smoothProgress, [0.65, 0.72, 0.85, 0.92], [0, 1, 1, 0]),
						y: useTransform(smoothProgress, [0.65, 0.72, 0.85, 0.92], [100, 0, -20, -100]),
					}}
					className="absolute bottom-0 left-6 top-0 z-20 flex w-[85%] flex-col justify-center md:left-24 md:w-[42%]"
				>
					<div className="mb-2 inline-block text-6xl font-black italic tracking-tighter text-slate-200 md:text-8xl">
						2020
					</div>
					<div className="mb-8 flex items-center gap-3">
						<Minus className="text-slate-400" size={24} strokeWidth={1.5} />
						<h3 className="text-2xl font-medium tracking-tight text-slate-800 md:text-3xl">
							La era de los portales
						</h3>
					</div>
					<div className="space-y-6">
						<div className="relative pl-5 border-l-2 border-slate-200 before:absolute before:-left-[5px] before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-[#FF8000]">
							<p className="text-base font-normal leading-relaxed text-slate-700">
								El 90% de las inmobiliarias publican en portales. <span className="font-semibold text-slate-900 border-b border-[#FF8000]/30 pb-0.5">La digitalización llega</span> y empieza a ganar territorio.
							</p>
						</div>
						<div className="relative pl-5 border-l-2 border-slate-200 before:absolute before:-left-[5px] before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-[#FF8000]">
							<p className="text-base font-normal leading-relaxed text-slate-700">
								Momento de <span className="font-semibold text-slate-900 border-b border-[#FF8000]/30 pb-0.5">cada vez más aperturas</span> de inmobiliarias y mayor dificultad en captación hasta la actualidad.
							</p>
						</div>
						<div className="relative pl-5 border-l-2 border-[#FF8000] before:absolute before:-left-[5px] before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-[#FF8000] bg-[#FF8000]/5 p-4 rounded-r-xl">
							<p className="text-base font-medium italic leading-relaxed text-slate-800">
								Pero las inmobiliarias solo han cambiado la manera de buscar compradores 
								(antes en revistas y ahora en portales), <span className="text-[#FF8000] font-bold not-italic">y ahora toca vivir el siguiente cambio.</span>
							</p>
						</div>
					</div>
				</motion.div>

				<motion.div
					style={{
						opacity: useTransform(smoothProgress, [0.85, 0.92], [0, 1]),
						scale: useTransform(smoothProgress, [0.85, 0.92], [0.95, 1]),
						y: useTransform(smoothProgress, [0.85, 0.92], [30, 0]),
					}}
					className="absolute inset-0 z-30 flex items-center justify-center px-4 md:px-12"
				>
					<div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-[0_40px_100px_-20px_rgba(255,128,0,0.2)] md:rounded-[2.5rem] md:p-16">
						<div className="pointer-events-none absolute right-0 top-0 h-full w-[60%] bg-gradient-to-l from-[#FF8000]/20 to-transparent blur-3xl" />

						<div className="relative z-10">
							<div className="mb-8 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-center">
								<div className="flex items-center gap-4 md:gap-5">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF8000] shadow-[0_0_30px_rgba(255,128,0,0.5)] md:h-14 md:w-14">
										<Zap className="text-white md:w-7 md:h-7" size={24} fill="white" />
									</div>
									<div>
										<h3 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
											Sistema Cosiris
										</h3>
										<p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/80 md:tracking-[0.3em]">
											Autoridad Predictiva
										</p>
									</div>
								</div>
								<div className="hidden rounded-full border border-white/10 bg-white/5 px-6 py-2 backdrop-blur-sm md:block">
									<span className="text-xs uppercase tracking-widest text-white/60">Modelo Actual</span>
								</div>
							</div>

							<div className="mb-8 grid grid-cols-1 gap-x-12 gap-y-6 md:mb-16 md:grid-cols-2 md:gap-y-10">
								{[
									{
										t: 'Captación de leads',
										d: 'Ideal para captar propietarios vendedores, inversores, obra nueva, etc.',
									},
									{
										t: 'Email marketing',
										d: 'Tu buzoneo digital que hace seguimiento a tu base de datos.',
									},
									{
										t: 'Gestión de Redes Sociales',
										d: 'Confianza masiva generada antes de la primera llamada.',
									},
									{
										t: 'Agentes de IA',
										d: 'Atiende llamadas de portales, bots de whatsapp que atiende y cualifican a tus leads y otras soluciones a medida.',
									},
								].map((item, index) => (
									<div key={index} className="group">
										<div className="mb-2 flex items-center gap-2 md:gap-3">
											<ChevronRight
												className="text-[#FF8000] transition-transform duration-300 group-hover:translate-x-2"
												size={16}
												strokeWidth={3}
											/>
											<h4 className="text-base font-bold text-white md:text-xl">{item.t}</h4>
										</div>
										<p className="pl-6 text-xs font-light leading-relaxed text-slate-400 md:pl-7 md:text-sm">
											{item.d}
										</p>
									</div>
								))}
							</div>

							<div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 md:flex-row md:gap-8 md:pt-10">
								<div className="text-center md:text-left">
									<p className="text-base font-medium italic tracking-tight text-[#FF8000] md:text-lg">
										"Sistema automatizado con resultados predecibles."
									</p>
								</div>
								<button
								onClick={() => openContactModal({ sourceContext: 'evolution_cta' })}
									className="group flex w-full items-center justify-center gap-3 rounded-md bg-[#FF8000] px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(255,128,0,0.3)] transition-all hover:-translate-y-1 hover:bg-[#FF9533] md:w-auto md:gap-4 md:px-10 md:py-5 md:text-sm"
								>
									PIDE MÁS INFORMACIÓN
									<ArrowRight size={16} className="transition-transform group-hover:translate-x-1 md:w-[18px]" />
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}

