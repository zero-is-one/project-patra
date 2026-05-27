export type LessonLetter = {
  char: string;
  transliteration?: string;
  code?: string;
};

export type Lesson = {
  name: string;
  description?: string;
  letters: LessonLetter[];
};

export type LessonCatalog = {
  lessons: Lesson[];
};

export type LetterPathBundle = {
  paths: string[];
  width: number;
  height: number;
};

export type LetterPathMap = Record<string, LetterPathBundle>;

export type DrawableLessonLetter = {
  char: string;
  key: string;
  bundle: LetterPathBundle;
};
