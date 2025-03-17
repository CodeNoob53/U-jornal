-- Розширюємо тип user_role, щоб додати нові ролі
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'curator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'dean';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vice_dean';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'group_leader';

-- Додаємо нову таблицю для зберігання додаткових ролей користувачів
CREATE TABLE user_roles_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  faculty_id UUID REFERENCES faculties(id),
  department_id UUID REFERENCES departments(id),
  group_id UUID REFERENCES student_groups(id),
  is_curator BOOLEAN DEFAULT FALSE,
  is_dean BOOLEAN DEFAULT FALSE,
  is_vice_dean BOOLEAN DEFAULT FALSE, 
  is_group_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Додаємо індекси для підвищення продуктивності запитів
CREATE INDEX idx_user_roles_extended_user_id ON user_roles_extended(user_id);
CREATE INDEX idx_user_roles_extended_is_curator ON user_roles_extended(is_curator) WHERE is_curator = TRUE;
CREATE INDEX idx_user_roles_extended_is_dean ON user_roles_extended(is_dean) WHERE is_dean = TRUE;
CREATE INDEX idx_user_roles_extended_is_vice_dean ON user_roles_extended(is_vice_dean) WHERE is_vice_dean = TRUE;
CREATE INDEX idx_user_roles_extended_is_group_leader ON user_roles_extended(is_group_leader) WHERE is_group_leader = TRUE;

-- Додаємо таблицю для журналу відвідування
CREATE TABLE attendance_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES student_groups(id) NOT NULL,
  subject_id UUID REFERENCES subjects(id) NOT NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, subject_id, date)
);

-- Додаємо таблицю для записів журналу відвідування
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID REFERENCES attendance_journal(id) NOT NULL,
  student_id UUID REFERENCES students(id) NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(journal_id, student_id)
);

-- Функція для перевірки доступу до журналу відвідування
CREATE OR REPLACE FUNCTION check_attendance_journal_access(
  p_user_id UUID,
  p_group_id UUID,
  p_faculty_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_is_allowed BOOLEAN := FALSE;
BEGIN
  -- Отримуємо роль користувача
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  -- Адміністратор має доступ до всіх журналів
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Перевіряємо доступ для інших ролей
  SELECT EXISTS (
    SELECT 1
    FROM user_roles_extended ure
    LEFT JOIN students s ON s.user_id = p_user_id AND s.group_id = p_group_id
    WHERE ure.user_id = p_user_id AND (
      -- Декан і заступники мають доступ до журналів свого факультету
      ((ure.is_dean = TRUE OR ure.is_vice_dean = TRUE) AND ure.faculty_id = p_faculty_id)
      -- Куратор має доступ до журналу своєї групи
      OR (ure.is_curator = TRUE AND ure.group_id = p_group_id)
      -- Староста має доступ до журналу своєї групи
      OR (ure.is_group_leader = TRUE AND ure.group_id = p_group_id)
      -- Студент має доступ тільки до свого запису в журналі
      OR (v_user_role = 'student' AND s.id IS NOT NULL)
    )
  ) INTO v_is_allowed;
  
  RETURN v_is_allowed;
END;
$$ LANGUAGE plpgsql;