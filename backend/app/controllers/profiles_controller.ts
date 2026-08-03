import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { UserTransformer } from '#transformers/user_transformer'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'

export default class ProfilesController {
  /**
   * GET /account/profile
   * Devuelve el usuario autenticado. Requiere Bearer token.
   */
  @ApiOperation({ summary: 'Usuario autenticado' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: User })
  async show({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    return response.ok({ user: UserTransformer.toJSON(user) })
  }
}
