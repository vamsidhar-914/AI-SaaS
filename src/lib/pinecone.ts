import { Pinecone } from '@pinecone-database/pinecone'
import { env } from '~/env'

export const pc = new Pinecone({
    apiKey: env.PINECONE_API_KEY
})