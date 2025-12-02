import { ingestDocument } from '../src/chatbot/rag.service';
import dotenv from 'dotenv';

dotenv.config();

const main = async () => {
    console.log('Starting ingestion...');

    // Example document
    const doc = `
    Roommates is a platform for students to find compatible roommates.
    We prioritize safety and compatibility.
    Our matching algorithm considers cleanliness, study habits, pets, and budget.
  `;

    await ingestDocument(doc, { source: 'manual' });

    console.log('Ingestion complete.');
};

main().catch(console.error);
