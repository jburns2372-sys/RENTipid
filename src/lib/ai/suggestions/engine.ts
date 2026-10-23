import { suggestionRegistry, SupportSuggestion } from './registry';

export interface SuggestionContext {
  userRole: string; // e.g. 'Renter', 'Provider', 'Guest', 'Admin'
  currentRoute?: string;
  lifecycle?: string;
}

export interface SuggestionDTO {
  id: string;
  text: string;
  type: 'question' | 'topic';
  intent?: string;
}

export class SupportSuggestionEngine {
  static getSuggestions(context: SuggestionContext): { questions: SuggestionDTO[], topics: SuggestionDTO[] } {
    const role = context.userRole || 'Guest';
    const route = context.currentRoute;
    const lifecycle = context.lifecycle;

    // 1 & 2 done via context
    // 3. Apply role/visibility filter
    // 4. Apply route scope
    // 5. Apply lifecycle scope
    // 6. Remove disabled
    const eligible = suggestionRegistry.filter(s => {
      if (s.status !== 'enabled') return false;
      
      const roleAllowed = s.roleScope.includes('*') || s.roleScope.includes(role);
      if (!roleAllowed) return false;

      if (route && s.routeScope && s.routeScope.length > 0) {
        if (!s.routeScope.includes(route)) return false;
      }

      if (lifecycle && s.lifecycleScope && s.lifecycleScope.length > 0) {
        if (!s.lifecycleScope.includes(lifecycle)) return false;
      }

      return true;
    });

    // 7 & 8. Rank and deterministic tie-breaking
    eligible.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // higher priority first
      }
      return a.id.localeCompare(b.id); // stable tie break
    });

    // 9. Safe Presentation DTO
    const dtos: SuggestionDTO[] = eligible.map(s => ({
      id: s.id,
      text: s.displayText,
      type: s.type,
      intent: s.intent
    }));

    const questions = dtos.filter(d => d.type === 'question').slice(0, 4); // Limit to top 4 questions
    const topics = dtos.filter(d => d.type === 'topic');

    return { questions, topics };
  }
}
