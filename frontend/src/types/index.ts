export interface Step {
  step_no: number;
  content: string;
  is_valid: boolean;
  raw_ocr_confidence: number;
}

export interface HintGiven {
  step: number;
  level: number;
  text: string;
  style_name?: string;
}

export interface CheckApproachResponse {
  session_id: string;
  turn: number;
  is_solved: boolean;
  status: 'solved' | 'in_progress' | 'limit_reached';
  message: string;
  last_correct_step?: number | null;
  first_error_step?: number | null;
  hint?: HintGiven | null;
  full_solution?: string | null;
  extracted_text?: string;
  steps?: Step[];
  trace?: any;
}

export interface QuestionItem {
  id: string;
  title: string;
  question_text: string;
  topic?: string;
  difficulty?: string;
  whiteboard_image?: string | null;
  created_at?: string;
}
