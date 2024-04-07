import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../lib/prisma'

export async function registerForEvent(server: FastifyInstance) {
	server.withTypeProvider<ZodTypeProvider>().post(
		'/events/:eventId/attendees',
		{
			schema: {
				summary: 'Register an attendee',
				tags: ['attendees'],
				body: z.object({
					name: z.string(),
					email: z.string().email(),
				}),
				params: z.object({
					eventId: z.string().uuid(),
				}),
				response: {
					201: z.object({
						attendeeId: z.number().int().positive(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { name, email } = request.body
			const { eventId } = request.params

			const [event, attendeeFromEmail, amountOfAttendeesForEvent] =
				await Promise.all([
					prisma.event.findUnique({
						where: {
							id: eventId,
						},
					}),
					prisma.attendee.findUnique({
						where: {
							email_eventId: {
								email,
								eventId,
							},
						},
					}),
					prisma.attendee.count({
						where: {
							eventId,
						},
					}),
				])

			if (event === null) {
				throw new Error('Event not found.')
			}

			if (
				event.maximumAttendees &&
				amountOfAttendeesForEvent >= event.maximumAttendees
			) {
				throw new Error(
					'The maximum number of attendees for this event has been reached.',
				)
			}

			if (attendeeFromEmail !== null) {
				throw new Error('This email is already registered for this event.')
			}

			const attendee = await prisma.attendee.create({
				data: {
					name,
					email,
					eventId,
				},
			})

			return reply.code(201).send({ attendeeId: attendee.id })
		},
	)
}
