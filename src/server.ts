import fastify from 'fastify'
import {
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { createEvent } from './routes/create-event'
import { getAttendeeBadge } from './routes/get-attendee-badge'
import { getEvent } from './routes/get-event'
import { registerForEvent } from './routes/register-for-event'

const server = fastify()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(createEvent)
server.register(getEvent)
server.register(registerForEvent)
server.register(getAttendeeBadge)

const main = async () => {
	const port = 3333
	const host = 'localhost'

	try {
		await server.listen({ port, host })
		console.log(`Server running at http://${host}:${port}/`)
	} catch (error) {
		console.error(error)
	}
}
main()
