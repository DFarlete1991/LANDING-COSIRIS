// Inmobiliarias del directorio de Cosiris. Los logos se sirven desde la propia
// web para no depender de servidores ajenos.
// bg: color del círculo cuando el logo no es para fondo blanco.
// cover: el logo tiene fondo propio y llena el círculo, sin margen.
// profile: <ciudad>/<nombre> de su ficha, /inmobiliarias-en-<ciudad>/<nombre>.
// Sin él, la inmobiliaria no tiene ficha publicada en el directorio.
// circle: versión cuadrada para los círculos, con el margen recortado y su color
// de fondo hasta el borde. Se genera con `npm run logos` al añadir un logo.
export type ClientLogo = { src: string; alt: string; bg?: string; cover?: boolean; profile?: string; circle?: string };

const local = (file: string, alt: string, extra: Partial<ClientLogo> = {}): ClientLogo => ({
  src: `/assets/clientes/${file}.webp`,
  circle: `/assets/clientes/circulo/${file}.webp`,
  alt,
  ...extra,
});

export const CLIENT_LOGOS: ClientLogo[] = [
  local('capital', 'Inmobiliaria Capital'),
  local('century21-barcino', 'Century 21 Barcino', { profile: 'barcelona/century-21-barcino', cover: true }),
  local('habitat-nou', 'Habitat Nou', { profile: 'la-bisbal-del-penedes/habitat-nou' }),
  local('remax-royal', 'RE/MAX Masters Group', { profile: 'pamplona/remax-master-group', cover: true }),
  local('dss', 'DSS servicios inmobiliarios', { profile: 'donostia-san-sebastian/dss-servicios-inmobiliarios' }),
  local('coldwell-aster', 'Coldwell Banker Aster', { profile: 'barcelona/coldwell-banker-aster-real-estate', bg: '#0B2A5B' }),
  local('torresol', 'Grupo TorreSol', { profile: 'creixell/grupo-torresol' }),
  local('tecnocasa-leganes', 'Tecnocasa Leganés', { profile: 'leganes/tecnocasa-leganes' }),
  local('socio-casa', 'Socio Casa', { bg: '#1F120D' }),
  local('donpiso-donostia', 'Don Piso Donostia', { profile: 'donostia-san-sebastian/don-piso-donostia' }),
  local('cideb', 'Fincas Cideb', { profile: 'barcelona/fincas-cideb' }),
  local('boinder', 'Boinder Real Estate', { profile: 'madrid/boinder-real-estate' }),
  local('remax', 'REMAX Grupo Urbe'),
  local('borner', 'Borner Real Estate', { profile: 'sant-cugat-del-valles/borner-real-estate' }),
  local('grupo-elimari', 'Grupo Elimari', { profile: 'la-rapita/grupo-elimari', cover: true }),
  local('hogares-group', 'Hogares Group', { profile: 'navalcarnero/hogares-group' }),
  local('cs-gestiones', 'CS Gestiones', { profile: 'zaragoza/cs-gestiones', cover: true }),
  local('nux-capital', 'Nux Capital', { profile: 'valencia/nux-capital' }),
  local('grupo-darek', 'Grupo Darek', { profile: 'fuenlabrada/grupo-darek', cover: true }),
  local('promysa', 'Promysa', { profile: 'tarragona/promysa' }),
  local('rimarent', 'Rimarent', { profile: 'girona/rimarent-serveis-immobiliaris' }),
  local('delasa', 'Delasa', { profile: 'donostia-san-sebastian/delasa-servicios-inmobiliarios', bg: '#14284F' }),
  local('finques-ebremont', 'Finques Ebremont', { profile: 'la-rapita/finques-ebremont' }),
  local('decasa', 'Decasa Santiago', { profile: 'santiago-de-compostela/decasa-santiago-servicios-inmobiliarios-s-l' }),
  local('gaboc', 'Gaboc', { profile: 'madrid/gaboc' }),
  local('haus-studio', 'Haus Studio', { profile: 'cornella-de-llobregat/haus-studio' }),
  local('mundocasa', 'Mundocasa Delicias', { profile: 'zaragoza/mundocasa-delicias', cover: true }),
  local('akasa', 'Akasa Pozuelo', { profile: 'pozuelo-de-alarcon/akasa-pozuelo' }),
  local('alfa-cuatro-vientos', 'Alfa Cuatro Vientos', { profile: 'madrid/alfa-cuatro-vientos' }),
  local('dacosta', 'Dacosta Real Estate', { profile: 'madrid/dacosta-real-estate', bg: '#1B2730' }),
  local('ak-inmolab', 'AK Inmolab', { profile: 'barcelona/ak-inmolab' }),
  local('century21-evolution', 'Century 21 Evolution', { profile: 'calpe/century-21-evolution', bg: '#3A3A38' }),
  local('mq-propiedades', 'MQ Propiedades', { profile: 'madrid/mq-propiedades' }),
  local('pisos-cases-girona', 'Pisos i Cases Girona', { profile: 'banyoles/pisos-i-cases-girona' }),
  local('elibeg', 'Elibeg', { profile: 'mostoles/elibeg' }),
  local('grupo-inmara', 'Grupo Inmara', { profile: 'alcorcon/grupo-inmara', cover: true }),
];
