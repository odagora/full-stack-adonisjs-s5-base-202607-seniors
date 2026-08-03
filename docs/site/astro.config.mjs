// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

// https://astro.build/config
export default defineConfig({
	// `base` ya refleja la ruta prevista para GitHub Pages (coincide con
	// project.name en .log4brains.yml). `site` (el dominio) sigue pendiente
	// hasta que se defina el owner/repo final del deploy:
	// site: 'https://<owner>.github.io',
	base: '/',
	integrations: [
		starlight({
			title: 'FlowSync Docs',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/odagora/full-stack-adonisjs-s5-base-202607-seniors',
				},
			],
			plugins: [
				// Genera las páginas de referencia de la API desde docs/site/openapi.yaml,
				// un snapshot del backend real (ver scripts/generate-openapi.sh).
				starlightOpenAPI([
					{
						base: 'api',
						schema: './openapi.yaml',
						sidebar: { label: 'FlowSync API' },
					},
				]),
			],
			sidebar: [
				{
					label: 'Decisiones (ADRs)',
					items: [{ autogenerate: { directory: 'adr' } }],
				},
				// Grupo de sidebar generado automáticamente por starlight-openapi.
				...openAPISidebarGroups,
			],
		}),
	],
});
