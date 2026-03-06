/*
  # Create Quiz System Tables

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `created_by` (uuid, references auth.users)
      - `time_limit` (integer, minutes)
      - `per_question_time` (integer, seconds, 0 = no limit)
      - `marks_per_question` (decimal)
      - `negative_marking` (boolean)
      - `negative_marks` (decimal)
      - `randomize_questions` (boolean)
      - `randomize_options` (boolean)
      - `total_questions` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `questions`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `question` (text)
      - `option_a` (text)
      - `option_b` (text)
      - `option_c` (text)
      - `option_d` (text)
      - `correct_answer` (text, a/b/c/d)
      - `explanation` (text, optional)
      - `created_at` (timestamp)

    - `quiz_attempts`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `user_id` (uuid, references auth.users)
      - `score` (integer)
      - `total_questions` (integer)
      - `correct_answers` (integer)
      - `wrong_answers` (integer)
      - `unattempted` (integer)
      - `percentage` (decimal)
      - `time_taken` (integer, seconds)
      - `submitted_at` (timestamp)
      - `created_at` (timestamp)

    - `user_answers`
      - `id` (uuid, primary key)
      - `attempt_id` (uuid, references quiz_attempts)
      - `question_id` (uuid, references questions)
      - `selected_answer` (text, a/b/c/d or null)
      - `is_correct` (boolean)
      - `is_flagged` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time_limit integer NOT NULL DEFAULT 60,
  per_question_time integer DEFAULT 0,
  marks_per_question decimal NOT NULL DEFAULT 1,
  negative_marking boolean DEFAULT false,
  negative_marks decimal DEFAULT 0,
  randomize_questions boolean DEFAULT false,
  randomize_options boolean DEFAULT false,
  total_questions integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL DEFAULT 0,
  wrong_answers integer NOT NULL DEFAULT 0,
  unattempted integer NOT NULL DEFAULT 0,
  percentage decimal NOT NULL DEFAULT 0,
  time_taken integer NOT NULL DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer text CHECK (selected_answer IN ('a', 'b', 'c', 'd') OR selected_answer IS NULL),
  is_correct boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes table
CREATE POLICY "Users can view all quizzes"
  ON quizzes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for questions table
CREATE POLICY "Users can view questions for accessible quizzes"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id
    )
  );

CREATE POLICY "Users can create questions for their own quizzes"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for their own quizzes"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions for their own quizzes"
  ON questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

-- Policies for quiz_attempts table
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts"
  ON quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
  ON quiz_attempts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_answers table
CREATE POLICY "Users can view their own answers"
  ON user_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = user_answers.attempt_id 
      AND quiz_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own answers"
  ON user_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = user_answers.attempt_id 
      AND quiz_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own answers"
  ON user_answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = user_answers.attempt_id 
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt_id ON user_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);