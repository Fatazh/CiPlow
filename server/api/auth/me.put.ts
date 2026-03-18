import { z } from 'zod'
import { getUserFromSession } from '~/server/utils/auth'
import prisma from '~/server/utils/prisma'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(50, 'Nama maksimal 50 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  avatar: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Belum login' })
  }

  const result = await readValidatedBody(event, (body) => updateProfileSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }

  const dataToUpdate: any = {}
  
  if (result.data.name && result.data.name !== user.name) {
    dataToUpdate.name = result.data.name
  }

  if (result.data.avatar !== undefined && result.data.avatar !== user.avatar) {
    dataToUpdate.avatar = result.data.avatar
  }

  if (result.data.email && result.data.email !== user.email) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: result.data.email }
    })

    if (existingEmail) {
      throw createError({ statusCode: 400, message: 'Email sudah terdaftar untuk akun lain' })
    }
    
    dataToUpdate.email = result.data.email
  }

  // Only update if there are changes
  if (Object.keys(dataToUpdate).length > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        currency: true,
        locale: true,
        createdAt: true,
      }
    })

    return {
      ok: true,
      data: updatedUser,
      message: 'Profil berhasil diperbarui'
    }
  }

  return {
    ok: true,
    data: user,
    message: 'Tidak ada perubahan profil'
  }
})