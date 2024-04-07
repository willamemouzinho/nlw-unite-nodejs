import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { BadRequest } from './_errors/bad-request'

export async function checkIn(server: FastifyInstance) {
	server.withTypeProvider<ZodTypeProvider>().get(
		'/attendees/:attendeeId/check-in',
		{
			schema: {
				summary: 'Check-in an attendee',
				tags: ['check-ins'],
				params: z.object({
					attendeeId: z.coerce.number().int(),
				}),
				response: {
					201: z.null(),
				},
			},
		},
		async (request, reply) => {
			const { attendeeId } = request.params

			const attendee = await prisma.attendee.findUnique({
				where: {
					id: attendeeId,
				},
				select: {
					name: true,
					email: true,
					event: {
						select: {
							title: true,
						},
					},
				},
			})
			if (attendee === null) {
				throw new BadRequest('Attendee not found.')
			}

			const attendeeCheckIn = await prisma.checkIn.findUnique({
				where: {
					attendeeId,
				},
			})

			if (attendeeCheckIn !== null) {
				throw new BadRequest('Attendee has already checked in to this event!')
			}

			await prisma.checkIn.create({
				data: {
					attendeeId,
				},
			})

			return reply.code(201).send()
		},
	)
}
