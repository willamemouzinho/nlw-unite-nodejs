import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../lib/prisma'

export async function getAttendeeBadge(server: FastifyInstance) {
	server.withTypeProvider<ZodTypeProvider>().get(
		'/attendees/:attendeeId/badge',
		{
			schema: {
				params: z.object({
					attendeeId: z.coerce.number(),
				}),
				response: {
					200: z.object({
						attendee: z.object({
							name: z.string(),
							email: z.string(),
							eventTitle: z.string(),
							checkInURL: z.string().url(),
						}),
					}),
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
				throw new Error('Attendee not found.')
			}

			const baseURL = `${request.protocol}://${request.hostname}`
			const checkInURL = new URL(`/attendees/${attendeeId}/check-in`, baseURL)

			return reply.code(200).send({
				attendee: {
					name: attendee.name,
					email: attendee.email,
					eventTitle: attendee.event.title,
					checkInURL: checkInURL.toString(),
				},
			})
		},
	)
}
