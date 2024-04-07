import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { BadRequest } from './_errors/bad-request'

export async function getEventAttendees(server: FastifyInstance) {
	server.withTypeProvider<ZodTypeProvider>().get(
		'/events/:eventId/attendees',
		{
			schema: {
				summary: 'Get event attendees',
				tags: ['events'],
				params: z.object({
					eventId: z.string().uuid(),
				}),
				querystring: z.object({
					query: z.string().nullish(),
					pageIndex: z.string().nullish().default('0').transform(Number),
				}),
				response: {
					200: z.object({
						attendees: z.array(
							z.object({
								id: z.number(),
								name: z.string(),
								email: z.string().email(),
								createdAt: z.date(),
								checkedInAt: z.date().nullable(),
							}),
						),
						totalAttendees: z.number(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { eventId } = request.params
			const { query, pageIndex } = request.query

			const [event, attendees, totalAttendees] = await Promise.all([
				prisma.event.findUnique({
					where: {
						id: eventId,
					},
				}),
				prisma.attendee.findMany({
					where: query
						? {
								eventId,
								name: {
									contains: query,
								},
							}
						: {
								eventId,
							},
					select: {
						id: true,
						name: true,
						email: true,
						createdAt: true,
						checkIn: {
							select: {
								createdAt: true,
							},
						},
					},
					take: 10,
					skip: 10 * pageIndex,
					orderBy: {
						createdAt: 'desc',
					},
				}),
				prisma.attendee.count({
					where: query
						? {
								eventId,
								name: {
									contains: query,
								},
							}
						: {
								eventId,
							},
				}),
			])

			if (event === null) {
				throw new BadRequest('Event not found.')
			}

			return reply.code(200).send({
				attendees: attendees.map((attendee) => {
					return {
						id: attendee.id,
						name: attendee.name,
						email: attendee.email,
						createdAt: attendee.createdAt,
						checkedInAt: attendee.checkIn?.createdAt ?? null,
					}
				}),
				totalAttendees,
			})
		},
	)
}
