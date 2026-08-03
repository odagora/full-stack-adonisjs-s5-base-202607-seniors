import vine from '@vinejs/vine'

/**
 * Valida el payload de registro de una nueva cuenta.
 */
export const signupValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const existing = await db.from('users').where('email', value).first()
        return !existing
      }),
    password: vine.string().minLength(8).maxLength(180),
  })
)

/**
 * Valida el payload de login.
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
)
