import type { HttpContext } from '@adonisjs/core/http'
import { ApiOperation } from '@foadonis/openapi/decorators'

export default class HealthController {
  /**
   * GET /api/v1/health
   * Endpoint de liveness. Creado en la Sesión 2 mediante el flujo OpenSpec.
   */
  @ApiOperation({ summary: 'Liveness check' })
  async index({ response }: HttpContext) {
    return response.ok({ status: 'ok' })
  }
}
