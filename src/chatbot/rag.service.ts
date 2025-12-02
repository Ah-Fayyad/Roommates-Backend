import { PrismaClient } from '@prisma/client';
// Placeholder for Claude API and Vector Store logic
// In a real implementation, we would use @anthropic-ai/sdk and @supabase/supabase-js

const prisma = new PrismaClient();

export const queryRAG = async (query: string) => {
    // 1. Embed query using Claude or other embedding model
    // 2. Search vector store for similar chunks
    // 3. Construct system prompt with context
    // 4. Call Claude API for answer

    const systemPrompt = `You are Roommates Assistant — friendly, student-focused, trustworthy.
Use ONLY provided context chunks.
For locations, always generate a Google Maps link using latitude/longitude.
Never hallucinate facts. If unsure, say:
"I'm not fully sure — would you like support?"
Keep responses short.`;

    // Mock response for now
    return `This is a mock response from the RAG service for query: "${query}". Context would be used here.`;
};

export const ingestDocument = async (content: string, metadata: any) => {
    // 1. Chunk document
    // 2. Embed chunks
    // 3. Store in VectorStore table

    // Mock storage - VectorStore model is currently disabled
    // TODO: Uncomment when pgvector extension is enabled
    // await prisma.vectorStore.create({
    //     data: {
    //         content,
    //         metadata,
    //     },
    // });

    console.log('Document ingestion skipped - VectorStore disabled');
};
