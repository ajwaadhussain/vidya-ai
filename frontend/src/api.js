const BASE_URL = 'https://vidya-ai-zq1q.onrender.com';

/**
 * Upload a PDF file to the backend for indexing.
 * @param {File} file - The PDF file to upload.
 * @param {string} sessionId - The current session UUID.
 * @returns {Promise<{status: string}>} Backend response.
 */
export async function uploadPDF(file, sessionId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Upload failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * Ask a question about the uploaded document.
 * @param {string} sessionId - The current session UUID.
 * @param {string} question - The user's question.
 * @returns {Promise<{answer: string}>} The AI's answer.
 */
export async function askQuestion(sessionId, question) {
  const response = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: "default",
      question: question,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}
