import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/DataService';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Calendar, Download, Filter, ChevronRight,
    ChevronDown, Building, GraduationCap, Users, Layers
} from 'lucide-react';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';
import { GroupAttendanceReport } from './GroupAttendanceReport';

export function FacultyAttendanceReport({ facultyId = null, showTitle = true }) {
    const { user, userRole, extendedRoles, isDean, isViceDean, getFacultyId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedFaculty, setSelectedFaculty] = useState(facultyId || '');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [expandedGroups, setExpandedGroups] = useState({});

    // Завантаження факультетів
    useEffect(() => {
        const loadFaculties = async () => {
            if (facultyId) {
                // Якщо передано конкретний факультет, використовуємо його
                setSelectedFaculty(facultyId);
                return;
            }

            try {
                setLoading(true);

                let facultiesData = [];

                if (userRole === 'admin') {
                    // Адміністратор бачить всі факультети
                    const facultiesResponse = await DataService.getFaculties();
                    facultiesData = facultiesResponse;
                } else if (isDean() || isViceDean()) {
                    // Декан і заступник бачать тільки свій факультет
                    const deanFacultyId = getFacultyId();

                    if (deanFacultyId) {
                        const { data, error } = await supabase
                            .from('faculties')
                            .select('*')
                            .eq('id', deanFacultyId)
                            .single();

                        if (error) throw error;
                        facultiesData = [data];
                        setSelectedFaculty(deanFacultyId);
                    }
                }

                setFaculties(facultiesData);
            } catch (err) {
                console.error('Помилка завантаження факультетів:', err);
                setError(`Помилка завантаження факультетів: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadFaculties();
    }, [facultyId, userRole, isDean, isViceDean, getFacultyId]);

    // Завантаження кафедр для вибраного факультету
    useEffect(() => {
        const loadDepartments = async () => {
            if (!selectedFaculty) {
                setDepartments([]);
                return;
            }

            try {
                setLoading(true);

                const departmentsData = await DataService.getDepartments(selectedFaculty);
                setDepartments(departmentsData);
            } catch (err) {
                console.error('Помилка завантаження кафедр:', err);
                setError(`Помилка завантаження кафедр: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadDepartments();
    }, [selectedFaculty]);

    // Завантаження груп для вибраної кафедри
    useEffect(() => {
        const loadGroups = async () => {
            if (!selectedFaculty) {
                setGroups([]);
                return;
            }

            try {
                setLoading(true);

                let groupsData = [];

                if (selectedDepartment) {
                    // Завантажуємо групи конкретної кафедри
                    const { data, error } = await supabase
                        .from('student_groups')
                        .select('*, departments(*)')
                        .eq('department_id', selectedDepartment)
                        .order('name');

                    if (error) throw error;
                    groupsData = data;
                } else {
                    // Завантажуємо всі групи факультету
                    groupsData = await DataService.getFacultyGroups(selectedFaculty);
                }

                setGroups(groupsData);
            } catch (err) {
                console.error('Помилка завантаження груп:', err);
                setError(`Помилка завантаження груп: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadGroups();
    }, [selectedFaculty, selectedDepartment]);

    // Завантаження даних журналів для факультету
    useEffect(() => {
        const loadFacultyJournals = async () => {
            if (!selectedFaculty) {
                setSummary(null);
                return;
            }

            try {
                setLoading(true);

                // Отримуємо журнали для факультету
                const journalsData = await DataService.getFacultyJournals(
                    selectedFaculty,
                    dateRange.startDate,
                    dateRange.endDate
                );

                // Аналізуємо дані журналів для створення зведеної статистики
                const departmentStats = {};
                const groupStats = {};

                // Для кожного журналу отримуємо записи відвідуваності
                for (const journal of journalsData) {
                    const records = await DataService.getAttendanceRecords(journal.id);

                    // Статистика по групах
                    const groupId = journal.group.id;
                    const groupName = journal.group.name;
                    const departmentId = journal.group.department_id;
                    const departmentName = journal.group.departments?.name || 'Без кафедри';

                    if (!groupStats[groupId]) {
                        groupStats[groupId] = {
                            id: groupId,
                            name: groupName,
                            departmentId,
                            departmentName,
                            totalClasses: 0,
                            totalRecords: 0,
                            presentCount: 0,
                            absentCount: 0,
                            attendancePercentage: 0
                        };
                    }

                    // Статистика по кафедрах
                    if (!departmentStats[departmentId]) {
                        departmentStats[departmentId] = {
                            id: departmentId,
                            name: departmentName,
                            totalClasses: 0,
                            totalRecords: 0,
                            presentCount: 0,
                            absentCount: 0,
                            attendancePercentage: 0,
                            groupsCount: 0,
                            uniqueGroups: new Set()
                        };
                    }

                    // Оновлюємо статистику групи
                    groupStats[groupId].totalClasses += 1;
                    groupStats[groupId].totalRecords += records.length;
                    groupStats[groupId].presentCount += records.filter(r => r.status === 'present').length;
                    groupStats[groupId].absentCount += records.filter(r => r.status === 'absent').length;

                    // Оновлюємо статистику кафедри
                    departmentStats[departmentId].totalClasses += 1;
                    departmentStats[departmentId].totalRecords += records.length;
                    departmentStats[departmentId].presentCount += records.filter(r => r.status === 'present').length;
                    departmentStats[departmentId].absentCount += records.filter(r => r.status === 'absent').length;
                    departmentStats[departmentId].uniqueGroups.add(groupId);
                }

                // Розраховуємо відсотки і фіналізуємо статистику
                // Групи
                Object.values(groupStats).forEach(group => {
                    group.attendancePercentage = group.totalRecords > 0
                        ? ((group.presentCount / group.totalRecords) * 100).toFixed(2)
                        : 0;
                });

                // Кафедри
                Object.values(departmentStats).forEach(dept => {
                    dept.attendancePercentage = dept.totalRecords > 0
                        ? ((dept.presentCount / dept.totalRecords) * 100).toFixed(2)
                        : 0;
                    dept.groupsCount = dept.uniqueGroups.size;
                    delete dept.uniqueGroups; // Видаляємо Set, який не потрібен далі
                });

                // Загальна статистика факультету
                const facultyTotalClasses = Object.values(departmentStats).reduce((sum, dept) => sum + dept.totalClasses, 0);
                const facultyTotalRecords = Object.values(departmentStats).reduce((sum, dept) => sum + dept.totalRecords, 0);
                const facultyPresentCount = Object.values(departmentStats).reduce((sum, dept) => sum + dept.presentCount, 0);
                const facultyAbsentCount = Object.values(departmentStats).reduce((sum, dept) => sum + dept.absentCount, 0);
                const facultyAttendancePercentage = facultyTotalRecords > 0
                    ? ((facultyPresentCount / facultyTotalRecords) * 100).toFixed(2)
                    : 0;

                // Групуємо групи по кафедрах
                const groupsByDepartment = {};
                Object.values(groupStats).forEach(group => {
                    if (!groupsByDepartment[group.departmentId]) {
                        groupsByDepartment[group.departmentId] = [];
                    }
                    groupsByDepartment[group.departmentId].push(group);
                });

                // Сортуємо групи за назвою
                Object.values(groupsByDepartment).forEach(groups => {
                    groups.sort((a, b) => a.name.localeCompare(b.name));
                });

                setSummary({
                    faculty: {
                        totalClasses: facultyTotalClasses,
                        totalRecords: facultyTotalRecords,
                        presentCount: facultyPresentCount,
                        absentCount: facultyAbsentCount,
                        attendancePercentage: facultyAttendancePercentage,
                        departmentsCount: Object.keys(departmentStats).length,
                        groupsCount: Object.keys(groupStats).length
                    },
                    departments: Object.values(departmentStats).sort((a, b) => a.name.localeCompare(b.name)),
                    groupsByDepartment
                });
            } catch (err) {
                console.error('Помилка завантаження даних факультету:', err);
                setError(`Помилка завантаження даних: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadFacultyJournals();
    }, [selectedFaculty, dateRange]);

    // Обробка зміни фільтрів
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        if (name === 'faculty') {
            setSelectedFaculty(value);
            setSelectedDepartment('');
            setSelectedGroup('');
        } else if (name === 'department') {
            setSelectedDepartment(value);
            setSelectedGroup('');
        } else if (name === 'group') {
            setSelectedGroup(value);
        } else if (name === 'startDate' || name === 'endDate') {
            setDateRange(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Перемикання розгорнутого стану групи
    const toggleGroupExpand = (departmentId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [departmentId]: !prev[departmentId]
        }));
    };

    return (
        <div>
            {showTitle && (
                <h2 className="text-xl font-bold mb-4">Звіт відвідуваності факультету</h2>
            )}

            {error && <ErrorAlert message={error} />}

            {/* Фільтри звіту */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Вибір факультету (тільки для адміністратора) */}
                    {userRole === 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Факультет
                            </label>
                            <select
                                name="faculty"
                                value={selectedFaculty}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Виберіть факультет</option>
                                {faculties.map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Вибір кафедри */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Кафедра
                        </label>
                        <select
                            name="department"
                            value={selectedDepartment}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Всі кафедри</option>
                            {departments.map(department => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Початкова дата */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Початкова дата
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={dateRange.startDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Кінцева дата */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Кінцева дата
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={dateRange.endDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Якщо вибрана група, показуємо детальний звіт для неї */}
            {selectedGroup ? (
                <GroupAttendanceReport
                    groupId={selectedGroup}
                    showTitle={false}
                />
            ) : loading ? (
                <LoadingIndicator />
            ) : summary ? (
                <div className="space-y-6">
                    {/* Загальна статистика факультету */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-medium">Загальна статистика факультету</h3>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Building className="w-8 h-8 text-blue-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Кафедр</p>
                                            <p className="text-2xl font-bold">{summary.faculty.departmentsCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <GraduationCap className="w-8 h-8 text-purple-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Груп</p>
                                            <p className="text-2xl font-bold">{summary.faculty.groupsCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Calendar className="w-8 h-8 text-green-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Занять</p>
                                            <p className="text-2xl font-bold">{summary.faculty.totalClasses}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Users className="w-8 h-8 text-yellow-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Відвідуваність</p>
                                            <p className="text-2xl font-bold">{summary.faculty.attendancePercentage}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="bg-gray-200 h-2 rounded-full">
                                            <div
                                                className={`h-2 rounded-full ${parseFloat(summary.faculty.attendancePercentage) >= 80 ? 'bg-green-500' :
                                                        parseFloat(summary.faculty.attendancePercentage) >= 60 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                    }`}
                                                style={{ width: `${summary.faculty.attendancePercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Статистика по кафедрах */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-medium">Відвідуваність по кафедрах</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Кафедра
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Груп
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Занять
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Відвідуваність
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Деталі
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {summary.departments.map(department => (
                                        <React.Fragment key={department.id}>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {department.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    {department.groupsCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    {department.totalClasses}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="bg-gray-200 h-2 w-24 rounded-full mr-2">
                                                            <div
                                                                className={`h-2 rounded-full ${parseFloat(department.attendancePercentage) >= 80 ? 'bg-green-500' :
                                                                        parseFloat(department.attendancePercentage) >= 60 ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${department.attendancePercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span>{department.attendancePercentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <button
                                                        onClick={() => toggleGroupExpand(department.id)}
                                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                    >
                                                        {expandedGroups[department.id] ? (
                                                            <>
                                                                <ChevronDown className="w-4 h-4 mr-1" />
                                                                Сховати групи
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronRight className="w-4 h-4 mr-1" />
                                                                Показати групи
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Розгорнуті групи кафедри */}
                                            {expandedGroups[department.id] && summary.groupsByDepartment[department.id]?.map(group => (
                                                <tr key={group.id} className="bg-gray-50 border-b border-gray-100">
                                                    <td className="px-6 py-3 pl-12 whitespace-nowrap text-sm text-gray-900">
                                                        {group.name}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                                        -
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                                        {group.totalClasses}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="bg-gray-200 h-2 w-24 rounded-full mr-2">
                                                                <div
                                                                    className={`h-2 rounded-full ${parseFloat(group.attendancePercentage) >= 80 ? 'bg-green-500' :
                                                                            parseFloat(group.attendancePercentage) >= 60 ? 'bg-yellow-500' :
                                                                                'bg-red-500'
                                                                        }`}
                                                                    style={{ width: `${group.attendancePercentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span>{group.attendancePercentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                                                        <button
                                                            onClick={() => setSelectedGroup(group.id)}
                                                            className="text-blue-600 hover:text-blue-900 text-sm"
                                                        >
                                                            Детальніше
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}

                                    {summary.departments.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                Немає даних про відвідування кафедр за вказаний період
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Візуалізація - порівняльна діаграма кафедр */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-medium">Порівняльний аналіз відвідуваності кафедр</h3>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {summary.departments.map(department => (
                                    <div key={department.id} className="flex items-center">
                                        <span className="w-1/4 text-sm text-gray-700 truncate pr-4">{department.name}</span>
                                        <div className="w-3/4">
                                            <div className="relative">
                                                <div className="flex h-4 overflow-hidden text-xs bg-gray-200 rounded">
                                                    <div
                                                        className={`${parseFloat(department.attendancePercentage) >= 80 ? 'bg-green-500' :
                                                                parseFloat(department.attendancePercentage) >= 60 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                            } flex flex-col text-center text-white justify-center`}
                                                        style={{ width: `${department.attendancePercentage}%` }}
                                                    >
                                                        {parseFloat(department.attendancePercentage) > 10 && (
                                                            `${department.attendancePercentage}%`
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>{selectedFaculty ? 'Немає даних про відвідування за вказаний період' : 'Виберіть факультет для перегляду статистики відвідуваності'}</p>
                </div>
            )}
        </div>
    );
}