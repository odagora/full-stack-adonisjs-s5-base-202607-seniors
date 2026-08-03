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

  /*
  |----------------------------------------------------------------------
  | NOTA PARA EL FORMADOR:
  | El endpoint GET /api/v1/users/active (usuarios vistos en las
  | últimas 24h) se implementa EN VIVO durante la demo de la Sesión 3
  | aplicando el flujo Explore-Plan-Execute. No lo pre-implementes aquí.
  |----------------------------------------------------------------------
  */
}
