// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

// https://astro.build/config
export default defineConfig({
	// Deploy en GitHub Pages (project site, URL default): ver
	// .github/workflows/deploy-docs.yml.
	site: 'https://odagora.github.io',
	base: '/full-stack-adonisjs-s5-base-202607-seniors',
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
