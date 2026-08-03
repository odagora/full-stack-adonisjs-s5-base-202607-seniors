import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { signupValidator } from '#validators/auth'
import { UserTransformer } from '#transformers/user_transformer'
import { ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'

export default class NewAccountsController {
  /**
   * POST /account/register
   * Crea una cuenta nueva y devuelve el usuario + un access token.
   */
  @ApiOperation({ summary: 'Registrar una cuenta nueva' })
  @ApiBody({ type: () => signupValidator })
  @ApiResponse({ status: 201, type: User, description: 'Cuenta creada' })
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(signupValidator)

    const user = await User.create(data)
    const token = await User.accessTokens.create(user)

    return response.created({
      user: UserTransformer.toJSON(user),
      token: token.value!.release(),
    })
  }
}
