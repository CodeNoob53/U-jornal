import { supabase } from '../lib/supabase';

// Сервіс для роботи з даними з Supabase з покращеним налагодженням
export const DataService = {
  // Логування запитів для налагодження
  async executeQuery(queryFn, errorMessage) {
    try {
      const result = await queryFn();
      
      // Логуємо успішні запити та їх результати
      console.log(`Успішний запит:`, result);
      
      if (result.error) {
        console.error(`${errorMessage}:`, result.error);
        throw result.error;
      }
      
      return result.data;
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw error;
    }
  },

  // Користувачі
  async getUsers() {
    return this.executeQuery(
      () => supabase.from('users').select('*').order('full_name'),
      'Помилка отримання користувачів'
    );
  },
  
  // Факультети
  async getFaculties() {
    return this.executeQuery(
      () => supabase.from('faculties').select('*').order('name'),
      'Помилка отримання факультетів'
    );
  },
  
  async createFaculty(name) {
    const result = await this.executeQuery(
      () => supabase.from('faculties').insert([{ name }]).select(),
      'Помилка створення факультету'
    );
    return result[0];
  },
  
  // Кафедри
  async getDepartments(facultyId = null) {
    let query = supabase
      .from('departments')
      .select('*, faculties(id, name)')
      .order('name');
    
    if (facultyId) {
      query = query.eq('faculty_id', facultyId);
    }
    
    return this.executeQuery(
      () => query,
      'Помилка отримання кафедр'
    );
  },
  
  async createDepartment(facultyId, name) {
    const result = await this.executeQuery(
      () => supabase.from('departments').insert([{ faculty_id: facultyId, name }]).select(),
      'Помилка створення кафедри'
    );
    return result[0];
  },
  
  // Предмети
  async getSubjects(departmentId = null) {
    let query = supabase
      .from('subjects')
      .select('*, departments(id, name)')
      .order('name');
    
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }
    
    return this.executeQuery(
      () => query,
      'Помилка отримання предметів'
    );
  },
  
  async createSubject(departmentId, name, credits, maxPoints = 100) {
    const result = await this.executeQuery(
      () => supabase.from('subjects').insert([{ 
        department_id: departmentId, 
        name, 
        credits,
        max_points: maxPoints
      }]).select(),
      'Помилка створення предмету'
    );
    return result[0];
  },
  
  // Групи студентів
  async getStudentGroups(departmentId = null) {
    let query = supabase
      .from('student_groups')
      .select('*, departments(id, name)')
      .order('name');
    
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }
    
    return this.executeQuery(
      () => query,
      'Помилка отримання груп'
    );
  },
  
  // Статистика для панелі адміністратора
  async getDashboardStats() {
    try {
      console.log("Запит статистики розпочато");
      
      // Отримуємо кількість користувачів
      const usersCount = await this.executeQuery(
        () => supabase.from('users').select('*', { count: 'exact', head: true }),
        'Помилка підрахунку користувачів'
      );
      
      // Отримуємо кількість факультетів
      const facultiesCount = await this.executeQuery(
        () => supabase.from('faculties').select('*', { count: 'exact', head: true }),
        'Помилка підрахунку факультетів'
      );
      
      // Отримуємо кількість предметів
      const subjectsCount = await this.executeQuery(
        () => supabase.from('subjects').select('*', { count: 'exact', head: true }),
        'Помилка підрахунку предметів'
      );
      
      // Повертаємо зібрану статистику
      const stats = {
        usersCount: usersCount.count || 0,
        facultiesCount: facultiesCount.count || 0,
        subjectsCount: subjectsCount.count || 0
      };
      
      console.log("Отримана статистика:", stats);
      return stats;
    } catch (error) {
      console.error('Помилка отримання статистики:', error);
      // Повертаємо нульову статистику в разі помилки
      return {
        usersCount: 0,
        facultiesCount: 0,
        subjectsCount: 0
      };
    }
  },
  
  // Отримання даних про одного користувача
  async getUserById(userId) {
    return this.executeQuery(
      () => supabase.from('users').select('*').eq('id', userId).single(),
      'Помилка отримання користувача'
    );
  },
  
  // Оновлення даних користувача
  async updateUser(userId, userData) {
    const result = await this.executeQuery(
      () => supabase.from('users').update(userData).eq('id', userId).select(),
      'Помилка оновлення користувача'
    );
    return result[0];
  },
  
  // Тестовий метод для перевірки з'єднання
  async testConnection() {
    console.log("Тестування з'єднання з Supabase");
    try {
      // Перевіряємо з'єднання простим запитом
      const { data, error } = await supabase.from('users').select('count', { count: 'estimated' }).limit(1);
      
      if (error) {
        console.error("Помилка з'єднання:", error);
        return { connected: false, error };
      }
      
      console.log("З'єднання успішне:", data);
      return { connected: true, data };
    } catch (err) {
      console.error("Критична помилка з'єднання:", err);
      return { connected: false, error: err.message };
    }
  },

  // Додайте ці методи до класу DataService у файлі src/services/DataService.js

  // Створення нового користувача
  async createUser(userData) {
    const { email, password, role, full_name, phone } = userData;
    
    // 1. Створюємо користувача через Auth API
    const authResult = await this.executeQuery(
      async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name
            }
          }
        });
        return { data, error };
      },
      'Помилка створення автентифікації користувача'
    );
    
    // 2. Створюємо запис у таблиці users
    const userResult = await this.executeQuery(
      () => supabase.from('users').insert([{
        id: authResult.user.id,
        email,
        role,
        full_name,
        phone: phone || null
      }]).select(),
      'Помилка створення запису користувача'
    );
    
    return userResult[0];
  },
  
  // Видалення користувача
  async deleteUser(userId) {
    return this.executeQuery(
      () => supabase.from('users').delete().eq('id', userId),
      'Помилка видалення користувача'
    );
  },
  
  // Оновлення користувача
  async updateUserRole(userId, role) {
    const result = await this.executeQuery(
      () => supabase.from('users')
        .update({ role })
        .eq('id', userId)
        .select(),
      'Помилка оновлення ролі користувача'
    );
    return result[0];
  },
  
  // Отримання користувача за Email
  async getUserByEmail(email) {
    return this.executeQuery(
      () => supabase.from('users')
        .select('*')
        .eq('email', email)
        .single(),
      'Помилка пошуку користувача'
    );
  },

  // Отримання додаткових ролей користувача
  async getUserExtendedRoles(userId) {
    return this.executeQuery(
      () => supabase
        .from('user_roles_extended')
        .select(`
          *,
          faculty:faculties(*),
          department:departments(*),
          group:student_groups(*)
        `)
        .eq('user_id', userId)
        .single(),
      'Помилка отримання розширених ролей користувача'
    );
  },

  // Призначення додаткової ролі користувачу
  async assignUserRole(userId, roleData) {
    // Спочатку перевіряємо, чи вже існує запис для цього користувача
    const { data: existingRole } = await supabase
      .from('user_roles_extended')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingRole) {
      // Оновлюємо існуючий запис
      return this.executeQuery(
        () => supabase
          .from('user_roles_extended')
          .update(roleData)
          .eq('user_id', userId)
          .select()
          .single(),
        'Помилка оновлення ролі користувача'
      );
    } else {
      // Створюємо новий запис
      return this.executeQuery(
        () => supabase
          .from('user_roles_extended')
          .insert([{ user_id: userId, ...roleData }])
          .select()
          .single(),
        'Помилка призначення ролі користувачу'
      );
    }
  },

  // Отримання журналу відвідування для групи і предмета
  async getAttendanceJournal(groupId, subjectId, startDate = null, endDate = null) {
    let query = supabase
      .from('attendance_journal')
      .select(`
        *,
        group:student_groups(*),
        subject:subjects(*)
      `)
      .eq('group_id', groupId)
      .eq('subject_id', subjectId)
      .order('date');
      
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    return this.executeQuery(
      () => query,
      'Помилка отримання журналу відвідування'
    );
  },

  // Отримання записів журналу відвідування для конкретного журналу
  async getAttendanceRecords(journalId) {
    return this.executeQuery(
      () => supabase
        .from('attendance_records')
        .select(`
          *,
          student:students(*, user:users(full_name, email))
        `)
        .eq('journal_id', journalId)
        .order('student->user->full_name'),
      'Помилка отримання записів відвідування'
    );
  },

  // Отримання записів відвідування для конкретного студента
  async getStudentAttendance(studentId, subjectId = null, startDate = null, endDate = null) {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        journal:attendance_journal(*, subject:subjects(*))
      `)
      .eq('student_id', studentId);
      
    if (subjectId) {
      query = query.filter('journal.subject_id', 'eq', subjectId);
    }
    
    if (startDate) {
      query = query.filter('journal.date', 'gte', startDate);
    }
    
    if (endDate) {
      query = query.filter('journal.date', 'lte', endDate);
    }
    
    return this.executeQuery(
      () => query.order('journal->date'),
      'Помилка отримання відвідування студента'
    );
  },

  // Отримання повної статистики відвідуваності для студента
  async getStudentAttendanceStats(studentId, subjectId = null, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          journal:attendance_journal(*, subject:subjects(*))
        `)
        .eq('student_id', studentId);
        
      // Add filters
      if (subjectId) {
        query = query.filter('journal.subject_id', 'eq', subjectId);
      }
      
      if (startDate) {
        query = query.filter('journal.date', 'gte', startDate);
      }
      
      if (endDate) {
        query = query.filter('journal.date', 'lte', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Calculate statistics
      const totalClasses = data.length;
      const presentCount = data.filter(record => record.status === 'present').length;
      const absentCount = data.filter(record => record.status === 'absent').length;
      
      // Group by subjects
      const subjectStats = data.reduce((acc, record) => {
        const subjectId = record.journal.subject.id;
        const subjectName = record.journal.subject.name;
        
        if (!acc[subjectId]) {
          acc[subjectId] = {
            id: subjectId,
            name: subjectName,
            total: 0,
            present: 0,
            absent: 0,
            percentage: 0
          };
        }
        
        acc[subjectId].total += 1;
        acc[subjectId][record.status] += 1;
        
        return acc;
      }, {});
      
      // Calculate percentages
      Object.values(subjectStats).forEach(stat => {
        stat.percentage = stat.total > 0 ? (stat.present / stat.total * 100).toFixed(2) : 0;
      });
      
      return {
        totalClasses,
        presentCount,
        absentCount,
        attendancePercentage: totalClasses > 0 ? (presentCount / totalClasses * 100).toFixed(2) : 0,
        subjectStats: Object.values(subjectStats)
      };
    } catch (error) {
      console.error('Помилка отримання статистики відвідуваності:', error);
      throw error;
    }
  },

  // Створення нового дня в журналі відвідування
  async createAttendanceJournalDay(groupId, subjectId, date, studentIds) {
    const currentUserId = (await supabase.auth.getUser()).data.user.id;
    const { data: journal, error: journalError } = await supabase
      .from('attendance_journal')
      .insert([{
        group_id: groupId,
        subject_id: subjectId,
        date: date,
        created_by: currentUserId
      }])
      .select()
      .single();
      
    if (journalError) {
      // Якщо запис на цю дату вже існує, спробуємо його отримати
      if (journalError.code === '23505') { // Duplicate key value
        const { data: existingJournal, error: getJournalError } = await supabase
          .from('attendance_journal')
          .select('*')
          .eq('group_id', groupId)
          .eq('subject_id', subjectId)
          .eq('date', date)
          .single();
          
        if (getJournalError) throw getJournalError;
        return existingJournal;
      }
      throw journalError;
    }
    // Створюємо записи для всіх студентів групи
    const attendanceRecords = studentIds.map(studentId => ({
      journal_id: journal.id,
      student_id: studentId,
      status: 'present', // За замовчуванням всі присутні
      created_by: currentUserId
    }));
 
    
    if (attendanceRecords.length > 0) {
      const { error: recordsError } = await supabase
        .from('attendance_records')
        .insert(attendanceRecords);
        
      if (recordsError) throw recordsError;
    }
    
    return journal;
  },

  // Оновлення статусу відвідування для студента
  async updateAttendanceStatus(recordId, status, notes = null) {
    return this.executeQuery(
      async () => {
        const { data: authData } = await supabase.auth.getUser();
        return supabase
          .from('attendance_records')
          .update({
            status: status,
            notes: notes,
            updated_by: authData.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId)
          .select()
          .single();
      },
      'Помилка оновлення статусу відвідування'
    );
  },

  // Отримання груп, для яких користувач є куратором
  async getCuratorGroups(userId) {
    return this.executeQuery(
      () => supabase
        .from('user_roles_extended')
        .select(`
          group:student_groups(*,
            department:departments(*),
            students(count)
          )
        `)
        .eq('user_id', userId)
        .eq('is_curator', true),
      'Помилка отримання груп куратора'
    );
  },

  // Отримання груп факультету (для декана/заступника)
  async getFacultyGroups(facultyId) {
    return this.executeQuery(
      () => supabase
        .from('student_groups')
        .select(`
          *,
          department:departments(*),
          students(count)
        `)
        .eq('department.faculty_id', facultyId)
        .order('name'),
      'Помилка отримання груп факультету'
    );
  },
};