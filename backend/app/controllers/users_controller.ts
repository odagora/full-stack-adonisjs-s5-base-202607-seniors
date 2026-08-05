import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { UserTransformer } from '#transformers/user_transformer'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@foadonis/openapi/decorators'

export default class UsersController {
  /**
   * GET /api/v1/users
   * Lista todos los usuarios. Requiere autenticación.
   */
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: [User] })
  async index({ response }: HttpContext) {
    const users = await User.query().orderBy('created_at', 'desc')
    return response.ok({ users: UserTransformer.collection(users) })
  }

  /**
   * GET /api/v1/users/:id
   * Devuelve un usuario por id. Requiere autenticación.
   */
  @ApiOperation({ summary: 'Obtener un usuario por id' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', schema: { type: 'integer' } })
  @ApiResponse({ status: 200, type: User })
  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.ok({ user: UserTransformer.toJSON(user) })
  }

  /**
   * GET /api/v1/users/active
   * Lista los usuarios vistos en las últimas 24h (last_seen_at). Requiere autenticación.
   */
  @ApiOperation({ summary: 'Listar usuarios activos (últimas 24h)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: [User] })
  async active({ response }: HttpContext) {
    const since = DateTime.now().minus({ hours: 24 })

    const users = await User.query()
      .where('last_seen_at', '>=', since.toSQL()!)
      .orderBy('last_seen_at', 'desc')

    return response.ok({ users: UserTransformer.collection(users) })
  }
}
