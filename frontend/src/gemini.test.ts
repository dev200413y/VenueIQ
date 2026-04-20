import { describe, it, expect } from 'vitest';
import { getGeminiResponse } from './gemini';

describe('Gemini API Service Logic', () => {
    it('should generate proper attendee context', async () => {
        // We test the mocked response behavior when no API keys are present initially
        const response = await getGeminiResponse('where is gate A', 'attendee');
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
    });

    it('should generate proper admin context', async () => {
        const response = await getGeminiResponse('what is current density', 'admin');
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
    });
});