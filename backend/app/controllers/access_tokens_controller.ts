import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth'
import { UserTransformer } from '#transformers/user_transformer'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'

export default class AccessTokensController {
  /**
   * POST /account/login
   * Verifica credenciales y emite un access token.
   */
  @ApiOperation({ summary: 'Login con email y password' })
  @ApiBody({ type: () => loginValidator })
  @ApiResponse({ status: 200, type: User, description: 'Login correcto' })
  async store({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)

    user.lastSeenAt = DateTime.now()
    await user.save()

    const token = await User.accessTokens.create(user)

    return response.ok({
      user: UserTransformer.toJSON(user),
      token: token.value!.release(),
    })
  }

  /**
   * POST /account/logout
   * Revoca el token usado en la petición actual.
   */
  @ApiOperation({ summary: 'Revocar el access token actual' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Token revocado' })
  async destroy({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const token = user.currentAccessToken
    await User.accessTokens.delete(user, token.identifier)

    return response.ok({ revoked: true })
  }
}
