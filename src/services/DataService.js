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
  }
};