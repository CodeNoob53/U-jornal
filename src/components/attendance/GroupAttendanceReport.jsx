import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/DataService';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Calendar, Download, Filter,
    AlertTriangle, Users, CheckCircle, XCircle
} from 'lucide-react';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function GroupAttendanceReport({ groupId = null, showTitle = true }) {
    const { user, userRole, extendedRoles, isCurator, isGroupLeader, getCuratorGroupId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [groups, setGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(groupId || '');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Завантаження списку груп
    useEffect(() => {
        const loadGroups = async () => {
            if (groupId) {
                // Якщо передано конкретну групу, використовуємо її
                setSelectedGroup(groupId);
                return;
            }

            try {
                setLoading(true);

                let groupsData = [];

                if (userRole === 'admin') {
                    // Адміністратор бачить всі групи
                    const { data, error } = await supabase
                        .from('student_groups')
                        .select('*, departments(*)')
                        .order('name');

                    if (error) throw error;
                    groupsData = data;
                } else if (isCurator() || isGroupLeader()) {
                    // Куратор і староста бачать тільки свою групу
                    const curatorGroupId = getCuratorGroupId();

                    if (curatorGroupId) {
                        const { data, error } = await supabase
                            .from('student_groups')
                            .select('*, departments(*)')
                            .eq('id', curatorGroupId)
                            .single();

                        if (error) throw error;
                        groupsData = [data];
                        setSelectedGroup(curatorGroupId);
                    }
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
    }, [groupId, userRole, isCurator, isGroupLeader, getCuratorGroupId]);

    // Завантаження предметів для вибраної групи
    useEffect(() => {
        const loadSubjects = async () => {
            if (!selectedGroup) {
                setSubjects([]);
                return;
            }

            try {
                setLoading(true);

                // Знаходимо всі предмети для групи
                const { data: groupSubjects, error: subjectsError } = await supabase
                    .from('teacher_subjects')
                    .select('*, subject:subjects(*)')
                    .eq('group_id', selectedGroup);

                if (subjectsError) throw subjectsError;

                // Виділяємо унікальні предмети
                const uniqueSubjects = [];
                groupSubjects.forEach(item => {
                    if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
                        uniqueSubjects.push(item.subject);
                    }
                });

                setSubjects(uniqueSubjects);
            } catch (err) {
                console.error('Помилка завантаження предметів:', err);
                setError(`Помилка завантаження предметів: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadSubjects();
    }, [selectedGroup]);

    // Завантаження статистики відвідуваності для групи
    useEffect(() => {
        const loadGroupStats = async () => {
            if (!selectedGroup) return;

            try {
                setLoading(true);

                // Завантажуємо статистику відвідуваності групи
                const statsData = await DataService.getGroupAttendanceStats(
                    selectedGroup,
                    selectedSubject || null,
                    dateRange.startDate,
                    dateRange.endDate
                );

                setStats(statsData);
            } catch (err) {
                console.error('Помилка завантаження статистики групи:', err);
                setError(`Помилка завантаження статистики відвідуваності: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadGroupStats();
    }, [selectedGroup, selectedSubject, dateRange]);

    // Обробка зміни фільтрів
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        if (name === 'group') {
            setSelectedGroup(value);
        } else if (name === 'subject') {
            setSelectedSubject(value);
        } else if (name === 'startDate' || name === 'endDate') {
            setDateRange(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Обробка сортування
    const handleSort = (field) => {
        if (sortField === field) {
            // Якщо поле вже вибране, змінюємо напрямок сортування
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Інакше встановлюємо нове поле сортування
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Сортування студентів
    const sortedStudents = stats?.studentStats.slice().sort((a, b) => {
        let valueA, valueB;

        switch (sortField) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'totalClasses':
                valueA = a.totalClasses;
                valueB = b.totalClasses;
                break;
            case 'presentCount':
                valueA = a.presentCount;
                valueB = b.presentCount;
                break;
            case 'absentCount':
                valueA = a.absentCount;
                valueB = b.absentCount;
                break;
            case 'attendancePercentage':
                valueA = parseFloat(a.attendancePercentage);
                valueB = parseFloat(b.attendancePercentage);
                break;
            default:
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
        }

        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    // Експорт звіту в CSV
    const handleExportReport = async () => {
        if (!selectedGroup || !stats) return;

        try {
            const csvData = await DataService.exportJournalToCSV(
                selectedGroup,
                selectedSubject || null,
                dateRange.startDate,
                dateRange.endDate
            );

            // Скачування файлу
            const encodedUri = encodeURI(csvData.csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
            link.setAttribute('download', csvData.filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Помилка експорту звіту:', err);
            setError(`Помилка експорту звіту: ${err.message}`);
        }
    };

    // Відображення іконки сортування
    const renderSortIcon = (field) => {
        if (sortField !== field) return null;

        return sortDirection === 'asc' ? (
            <span className="ml-1">↑</span>
        ) : (
            <span className="ml-1">↓</span>
        );
    };

    return (
        <div>
            {showTitle && (
                <h2 className="text-xl font-bold mb-4">Звіт відвідуваності групи</h2>
            )}

            {error && <ErrorAlert message={error} />}

            {/* Фільтри звіту */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Вибір групи (тільки для адміністратора) */}
                    {userRole === 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Група
                            </label>
                            <select
                                name="group"
                                value={selectedGroup}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Виберіть групу</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} - {group.departments?.name || 'Без кафедри'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Вибір предмета */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Предмет
                        </label>
                        <select
                            name="subject"
                            value={selectedSubject}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Всі предмети</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
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
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

            {/* Відображення статистики */}
            {loading ? (
                <LoadingIndicator />
            ) : stats ? (
                <div className="space-y-6">
                    {/* Загальна статистика групи */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Загальна статистика відвідуваності</h3>
                            <button
                                onClick={handleExportReport}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center text-sm"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Експорт
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Всього занять</p>
                                            <p className="text-2xl font-bold">{stats.totalSessionsCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Всього присутностей</p>
                                            <p className="text-2xl font-bold">{stats.totalPresentCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <XCircle className="w-8 h-8 text-red-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Всього пропусків</p>
                                            <p className="text-2xl font-bold">{stats.totalAbsentCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Users className="w-8 h-8 text-purple-500 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Середня відвідуваність</p>
                                            <p className="text-2xl font-bold">{stats.groupAttendancePercentage}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="bg-gray-200 h-2 rounded-full">
                                            <div
                                                className={`h-2 rounded-full ${parseFloat(stats.groupAttendancePercentage) >= 80 ? 'bg-green-500' :
                                                        parseFloat(stats.groupAttendancePercentage) >= 60 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                    }`}
                                                style={{ width: `${stats.groupAttendancePercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Таблиця відвідуваності студентів */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-medium">Відвідуваність студентів</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <span className="flex items-center">
                                                Студент
                                                {renderSortIcon('name')}
                                            </span>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('totalClasses')}
                                        >
                                            <span className="flex items-center justify-center">
                                                Всього занять
                                                {renderSortIcon('totalClasses')}
                                            </span>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('presentCount')}
                                        >
                                            <span className="flex items-center justify-center">
                                                Присутність
                                                {renderSortIcon('presentCount')}
                                            </span>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('absentCount')}
                                        >
                                            <span className="flex items-center justify-center">
                                                Пропуски
                                                {renderSortIcon('absentCount')}
                                            </span>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('attendancePercentage')}
                                        >
                                            <span className="flex items-center justify-center">
                                                Відсоток
                                                {renderSortIcon('attendancePercentage')}
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedStudents?.map((student) => (
                                        <tr key={student.id} className={parseFloat(student.attendancePercentage) < 50 ? 'bg-red-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                {student.totalClasses}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {student.presentCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    {student.absentCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="bg-gray-200 h-2 w-24 rounded-full mr-2">
                                                        <div
                                                            className={`h-2 rounded-full ${parseFloat(student.attendancePercentage) >= 80 ? 'bg-green-500' :
                                                                    parseFloat(student.attendancePercentage) >= 60 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                }`}
                                                            style={{ width: `${student.attendancePercentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{student.attendancePercentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {!sortedStudents || sortedStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                Немає даних про відвідування студентів за вказаний період
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Попередження для проблемних студентів */}
                    {sortedStudents && sortedStudents.some(student => parseFloat(student.attendancePercentage) < 50) && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        <strong>Увага!</strong> В групі є студенти з відвідуваністю нижче 50%.
                                        Рекомендуємо звернути на них увагу та провести відповідну роботу.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Графік відвідуваності за датами */}
                    {stats.dates && stats.dates.length > 0 && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="text-lg font-medium">Календар відвідувань</h3>
                            </div>

                            <div className="p-4 overflow-x-auto">
                                <div className="flex flex-wrap gap-2">
                                    {stats.dates.map(date => {
                                        const formattedDate = new Date(date).toLocaleDateString('uk-UA', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        });

                                        return (
                                            <div
                                                key={date}
                                                className="p-2 rounded bg-gray-100 text-xs flex flex-col items-center min-w-[80px]"
                                            >
                                                <span className="font-medium">{formattedDate}</span>
                                                <div className="flex justify-between items-center w-full mt-1">
                                                    <span className="text-green-600 flex items-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {/* Тут можна було б показати кількість присутніх на конкретну дату */}
                                                    </span>
                                                    <span className="text-red-600 flex items-center">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        {/* Тут можна було б показати кількість відсутніх на конкретну дату */}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>{selectedGroup ? 'Немає даних про відвідування за вказаний період' : 'Виберіть групу для перегляду статистики відвідуваності'}</p>
                </div>
            )}
        </div>
    );
}