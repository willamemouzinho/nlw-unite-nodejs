import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'

import { errorHandler } from './error-handler'
import { checkIn } from './routes/check-in'
import { createEvent } from './routes/create-event'
import { getAttendeeBadge } from './routes/get-attendee-badge'
import { getEvent } from './routes/get-event'
import { getEventAttendees } from './routes/get-event-attendees'
import { registerForEvent } from './routes/register-for-event'

const server = fastify()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(fastifyCors, {
	origin: '*',
})
server.register(fastifySwagger, {
	swagger: {
		consumes: ['application/json'],
		produces: ['application/json'],
		info: {
			title: 'pass.in',
			description:
				'Especificações da API para o back-end da aplicação pass.in construída durante o NLW Unite da Rocketseat.',
			version: '1.0.0',
		},
	},
	transform: jsonSchemaTransform,
})
server.register(fastifySwaggerUI, {
	routePrefix: '/docs',
})

server.register(createEvent)
server.register(getEvent)
server.register(registerForEvent)
server.register(getAttendeeBadge)
server.register(checkIn)
server.register(getEventAttendees)

server.setErrorHandler(errorHandler)

const main = async () => {
	const port = 3333
	const host = '0.0.0.0'

	try {
		await server.listen({ port, host })
		console.log(`Server running at http://${host}:${port}/`)
	} catch (error) {
		console.error(error)
	}
}
main()
