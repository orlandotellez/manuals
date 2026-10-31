/**
 * Manual registry.
 *
 * The single place where the structure of the library is declared: which
 * sections exist, in which order they read, and which chapter belongs to each
 * one. Chapter files stay plain Markdown under `src/content/manuals`; their
 * title, section and reading position come from here, the way mdBook's
 * `SUMMARY.md` used to carry them (S6).
 *
 * Adding a chapter is one Markdown file plus one line in `chapters`. The build
 * fails when the two disagree, so navigation can never point at a route that
 * does not exist.
 *
 * Plain JavaScript on purpose: the collection schema and the helpers import it
 * from both TypeScript and the Astro config without a loader flag.
 */

/** @typedef {{ id: string, title: string }} Section */
/** @typedef {{ id: string, title: string, section: string }} Chapter */

/** @type {readonly Section[]} */
export const sections = [
  { id: 'rust', title: 'Rust' },
  { id: 'tauri', title: 'Tauri' },
  { id: 'fastify', title: 'Fastify' },
  { id: 'express', title: 'Express' },
  { id: 'nextjs', title: 'NextJs' },
  { id: 'base-de-datos', title: 'Base de datos' },
  { id: 'aspnet-core', title: 'ASPNET CORE(C#)' },
  { id: 'react-native', title: 'React Native' },
  { id: 'flutter', title: 'Flutter' },
  { id: 'matrix-synapse', title: 'Matrix Synapse' },
  { id: 'redes', title: 'Redes' },
  { id: 'redes-de-datos-ii', title: 'Redes de Datos II' },
  { id: 'docker', title: 'Docker' },
  { id: 'git-y-github', title: 'Git y Github' },
  { id: 'linux', title: 'Linux' },
];

/** @type {readonly Chapter[]} */
export const chapters = [
  { id: '27-axum-init', title: 'Backend con Axum (Primeros pasos)', section: 'rust' },
  { id: '01-axum-techcomponents', title: 'Backend con Axum (techcomponents)', section: 'rust' },
  { id: '02-axum-rasflow', title: 'Backend con Axum (rasflow)', section: 'rust' },
  { id: '12-restix', title: 'Restix', section: 'rust' },
  { id: '26-tauri-apk-release', title: 'Crear apk con Tauri', section: 'tauri' },
  { id: '19-fastify-init', title: 'Backend Fastify Primeros Pasos', section: 'fastify' },
  { id: '28-backend-cajora-pos', title: 'Backend Fastify CajoraPos', section: 'fastify' },
  { id: '17-fastify-backend', title: 'Backend Farmacia', section: 'fastify' },
  { id: '24-express-primeros-pasos', title: 'Backend Express Primeros Pasos', section: 'express' },
  { id: '20-nextjs-init', title: 'NextJs', section: 'nextjs' },
  { id: '14-postgres-installation', title: 'Postgres', section: 'base-de-datos' },
  { id: '03-sqlx', title: 'SQLx', section: 'base-de-datos' },
  { id: '04-redis', title: 'Redis', section: 'base-de-datos' },
  { id: '06-prisma', title: 'Prisma', section: 'base-de-datos' },
  { id: '23-ef-core', title: 'Entity Framework Core', section: 'base-de-datos' },
  { id: '33-manual-backups-postgresql', title: 'Backups Postgres', section: 'base-de-datos' },
  { id: '21-aspnet-init', title: 'ASPNET Primeros Pasos', section: 'aspnet-core' },
  { id: '30-aspnet-auth', title: 'ASPNET Modulo de Autenticación', section: 'aspnet-core' },
  { id: '25-aspnet-cursinet', title: 'ASPNET Cursinet', section: 'aspnet-core' },
  { id: '05-react-native-primeros-pasos', title: 'React Native Primeros Pasos', section: 'react-native' },
  { id: '31-react-native-apk-release', title: 'React Native Generar Apk', section: 'react-native' },
  { id: '46-flutter-release', title: 'Flutter Generar Apk', section: 'flutter' },
  { id: '07-matrix-synapse', title: 'Matrix Synapse', section: 'matrix-synapse' },
  { id: '08-matrix-typescript-implementation', title: 'Matrix TypeScript implementation', section: 'matrix-synapse' },
  { id: '16-introduccion-redes', title: 'Introduccion redes', section: 'redes' },
  { id: '18-modelos-de-red', title: 'Modelo OSI y TCP/IP', section: 'redes' },
  { id: '09-direcciones-ip', title: 'Direcciones ip', section: 'redes' },
  { id: '10-redes-ejercicio-analisis-ipv4', title: 'Redes ejercicios', section: 'redes' },
  { id: '11-nat', title: 'NAT', section: 'redes' },
  { id: '22-mac-redes', title: 'MAC', section: 'redes' },
  { id: '15-comandos-packet-tracer', title: 'Comandos Packet Tracer', section: 'redes' },
  { id: '34-enrutamiento-ip-rutas-estaticas', title: 'Enrutamiento IP y Rutas Estáticas', section: 'redes-de-datos-ii' },
  { id: '35-seleccion-de-rutas', title: 'Selección de Rutas', section: 'redes-de-datos-ii' },
  { id: '36-enrutamiento-dinamico', title: 'Enrutamiento Dinámico', section: 'redes-de-datos-ii' },
  { id: '37-ospf-conceptos', title: 'OSPF: Conceptos y Configuración', section: 'redes-de-datos-ii' },
  { id: '38-ospf-avanzado', title: 'OSPF Avanzado: DR/BDR, LSA y Multi-Área', section: 'redes-de-datos-ii' },
  { id: '39-ospfv3-ipv6', title: 'OSPFv3 e IPv6', section: 'redes-de-datos-ii' },
  { id: '40-eigrp', title: 'EIGRP', section: 'redes-de-datos-ii' },
  { id: '41-is-is', title: 'IS-IS', section: 'redes-de-datos-ii' },
  { id: '42-bgp', title: 'BGP', section: 'redes-de-datos-ii' },
  { id: '43-redistribucion-ingenieria-trafico', title: 'Redistribución e ingeniería de tráfico', section: 'redes-de-datos-ii' },
  { id: '44-troubleshooting-routing', title: 'Troubleshooting de routing', section: 'redes-de-datos-ii' },
  { id: '45-laboratorios-integradores-proyecto-final', title: 'Laboratorios integradores y proyecto final', section: 'redes-de-datos-ii' },
  { id: '13-docker-installation', title: 'Docker Instalación', section: 'docker' },
  { id: '29-convencion-commits', title: 'Conventional Commits', section: 'git-y-github' },
  { id: '32-install-apps-linux', title: 'Instalar aplicaciones en Linux', section: 'linux' },
];

/** Section ids in reading order. */
export const sectionIds = sections.map((section) => section.id);

/** Chapter ids in reading order. */
export const chapterIds = chapters.map((chapter) => chapter.id);
