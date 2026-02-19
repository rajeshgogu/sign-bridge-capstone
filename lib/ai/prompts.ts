export function getTranslationAssistPrompt(text: string): string {
  return `You are an Indian Sign Language (ISL) expert. The user wants to communicate the following in ISL:

"${text}"

Please provide:
1. A step-by-step breakdown of how to sign this phrase in ISL
2. Which individual signs to use (list them in order)
3. Any important notes about grammar differences between spoken language and ISL
4. Tips for proper hand positioning and facial expressions

Keep the response concise and practical.`;
}

export function getSignExplanationPrompt(signName: string): string {
  return `Explain how to form the Indian Sign Language (ISL) sign for "${signName}".

Include:
1. Hand shape description
2. Starting position
3. Movement (if any)
4. Common mistakes to avoid
5. Related signs that look similar

Keep the explanation clear and suitable for a beginner.`;
}
