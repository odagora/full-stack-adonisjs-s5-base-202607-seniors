import path from 'node:path'
import url from 'node:url'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'full-stack-adonisjs-master',
  version: '1.0.0',
  tagIndex: 3,
  info: {
    title: 'full-stack-adonisjs-master',
    version: '1.0.0',
    description: 'API del starter kit full-stack con autenticación por access tokens',
  },
  snakeCase: true,
  debug: false,
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {},
  },
  securitySchemes: {},
  authMiddlewares: ['auth'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
  showFullPath: false,
}
