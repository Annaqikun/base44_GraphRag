// JavaScript Example: Reading Entities
// Filterable fields: title, authors, abstract, keywords, publication_year, journal, file_url, file_name, file_type, file_size, processing_status, processing_progress, extracted_content, knowledge_graph, version
async function fetchResearchPaperEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/68d9f1854ffcb89a47d29cdf/entities/ResearchPaper`, {
        headers: {
            'api_key': 'c988e603df5d4e1c9571f82cfed591cf', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: title, authors, abstract, keywords, publication_year, journal, file_url, file_name, file_type, file_size, processing_status, processing_progress, extracted_content, knowledge_graph, version
async function updateResearchPaperEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/68d9f1854ffcb89a47d29cdf/entities/ResearchPaper/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': 'c988e603df5d4e1c9571f82cfed591cf', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}