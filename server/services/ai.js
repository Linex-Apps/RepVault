import 'dotenv/config';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15_000; // 15 seconds

/**
 * Build a system prompt for the AI based on rating and tone.
 *
 * @param {number} rating - Review rating (1-5)
 * @param {string} tone - 'Professional', 'Friendly', or 'Grateful'
 * @returns {string} System prompt
 */
function buildSystemPrompt(rating, tone) {
  let toneInstruction = '';
  let ratingInstruction = '';

  switch (tone) {
    case 'Friendly':
      toneInstruction = 'Use a warm, conversational, and approachable tone. Be personable.';
      break;
    case 'Grateful':
      toneInstruction = 'Express genuine gratitude and appreciation. Make the customer feel valued.';
      break;
    case 'Professional':
    default:
      toneInstruction = 'Maintain a polished, respectful, and business-appropriate tone.';
      break;
  }

  if (rating >= 4) {
    ratingInstruction =
      'The customer left a positive review. Be thankful and appreciative. Acknowledge their kind words and let them know their feedback motivates the team.';
  } else if (rating === 3) {
    ratingInstruction =
      'The customer left a neutral review. Be courteous and open to feedback. Thank them for their input and mention that you value all feedback to improve.';
  } else {
    ratingInstruction =
      'The customer left a negative review. Be empathetic and apologetic. Acknowledge their experience, apologize sincerely, and offer to make it right. Do not make excuses.';
  }

  return `You are an AI assistant helping a local service business respond to customer reviews. ${ratingInstruction} ${toneInstruction}

Keep your response under 500 characters. Do not include any placeholders, brackets, or [example text]. Write in the first person as if you are the business owner. Do not ask for contact information or direct customers to call — instead, offer to follow up. Sign off naturally (e.g., "Best regards" or "Thank you").`;
}

/**
 * Draft an AI-generated response to a customer review using OpenAI's chat completions.
 *
 * @param {object} params
 * @param {string} params.review_text - The customer's review text
 * @param {number} params.rating - Review rating (1-5)
 * @param {string} [params.tone] - Response tone ('Professional', 'Friendly', 'Grateful')
 * @returns {Promise<{ draft: string, model: string, usage: object }>}
 */
export async function draftResponse({ review_text, rating, tone = 'Professional' }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('OPENAI_API_KEY environment variable is not set. Add it to start drafting responses.'),
      { statusCode: 500 }
    );
  }

  // Validate rating
  const safeRating = Math.max(1, Math.min(5, Math.round(rating || 3)));
  // Validate tone
  const validTones = ['Professional', 'Friendly', 'Grateful'];
  const safeTone = validTones.includes(tone) ? tone : 'Professional';

  const systemPrompt = buildSystemPrompt(safeRating, safeTone);

  const userMessage = review_text?.trim()
    ? `Here is the customer's review:\n\n"${review_text}"\n\nDraft a response.`
    : `The customer left a ${safeRating}-star review but didn't write any text. Draft a short response appropriate for a ${safeRating}-star rating.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      if (response.status === 401) {
        throw Object.assign(
          new Error('Invalid OpenAI API key. Check your OPENAI_API_KEY.'),
          { statusCode: 500 }
        );
      }
      if (response.status === 429) {
        throw Object.assign(
          new Error('OpenAI rate limit exceeded. Please try again shortly.'),
          { statusCode: 429 }
        );
      }
      throw Object.assign(
        new Error(`OpenAI API error (${response.status}): ${errorBody}`),
        { statusCode: response.status }
      );
    }

    const data = await response.json();
    const draft = data.choices?.[0]?.message?.content?.trim() || '';

    if (!draft) {
      throw Object.assign(
        new Error('OpenAI returned an empty response. Please try again.'),
        { statusCode: 500 }
      );
    }

    return {
      draft,
      model: data.model || 'gpt-4o-mini',
      usage: data.usage || {},
    };
  } catch (err) {
    clearTimeout(timeout);

    // Re-throw if it's already one of our structured errors
    if (err.statusCode) throw err;

    // Handle abort/timeout
    if (err.name === 'AbortError') {
      throw Object.assign(
        new Error('OpenAI request timed out after 15 seconds. Please try again.'),
        { statusCode: 504 }
      );
    }

    throw Object.assign(
      new Error(`Failed to draft response: ${err.message}`),
      { statusCode: 500 }
    );
  }
}