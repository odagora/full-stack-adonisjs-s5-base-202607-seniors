import { defineConfig } from '@foadonis/openapi'

export default defineConfig({
  ui: 'scalar',
  document: {
    info: {
      title: 'full-stack-adonisjs-master',
      version: '1.0.0',
      description: 'API del starter kit full-stack con autenticación por access tokens',
    },
    components: {
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer' },
      },
    },
  },
})
