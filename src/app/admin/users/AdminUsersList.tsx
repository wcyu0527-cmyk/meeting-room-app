'use client'

import { useState } from 'react'
import { updateUserRole, updateUserProfile, createUser, deleteUser, updateUserPassword } from './actions'

type Profile = {
    id: string
    full_name: string | null
    alias: string | null
    role: string | null
    email: string
}

export default function AdminUsersList({ profiles }: { profiles: Profile[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({
        full_name: '',
        alias: '',
        role: 'user',
        password: '',
    })
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Create User State
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [createForm, setCreateForm] = useState({
        username: '',
        password: '',
        full_name: '',
        alias: ''
    })
    const [isCreating, setIsCreating] = useState(false)

    const handleEdit = (profile: Profile) => {
        setEditingId(profile.id)
        setEditForm({
            full_name: profile.full_name || '',
            alias: profile.alias || '',
            role: profile.role || 'user',
            password: '',
        })
    }

    const handleSave = async (userId: string) => {
        setIsUpdating(true)
        try {
            await updateUserProfile(userId, editForm.full_name, editForm.alias)
            await updateUserRole(userId, editForm.role as 'user' | 'admin')

            if (editForm.password) {
                await updateUserPassword(userId, editForm.password)
            }

            setEditingId(null)
            window.location.reload()
        } catch (error) {
            alert('更新使用者失敗: ' + (error as Error).message)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('確定要刪除此使用者嗎？此操作無法復原。')) {
            return
        }

        setIsDeleting(userId)
        try {
            const result = await deleteUser(userId)
            if (result.success) {
                window.location.reload()
            } else {
                alert('刪除使用者失敗: ' + result.error)
            }
        } catch (error) {
            alert('刪除使用者失敗: ' + (error as Error).message)
        } finally {
            setIsDeleting(null)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            await createUser(createForm.username, createForm.password, createForm.full_name, createForm.alias)
            setShowCreateForm(false)
            setCreateForm({ username: '', password: '', full_name: '', alias: '' })
            window.location.reload()
        } catch (error) {
            alert('建立使用者失敗: ' + (error as Error).message)
        } finally {
            setIsCreating(false)
        }
    }

    const formatUsername = (email: string) => {
        return email ? email.replace('@meeting.local', '') : '未知'
    }

    return (
        <div>
            <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    使用者列表
                </h3>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {showCreateForm ? '取消新增' : '新增使用者'}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-gray-50 px-4 py-5 sm:px-6 border-b border-gray-200">
                    <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">帳號 (Username)</label>
                            <input
                                type="text"
                                required
                                value={createForm.username}
                                onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">密碼</label>
                            <input
                                type="password"
                                required
                                value={createForm.password}
                                onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">姓名</label>
                            <input
                                type="text"
                                value={createForm.full_name}
                                onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isCreating ? '建立中...' : '建立使用者'}
                        </button>
                    </form>
                </div>
            )}

            {!profiles || profiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    找不到使用者
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                帳號
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                姓名
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                角色
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                密碼
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {profiles.map((profile) => {
                            const isEditing = editingId === profile.id

                            return (
                                <tr key={profile.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        {formatUsername(profile.email)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.full_name}
                                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                                placeholder="姓名"
                                            />
                                        ) : (
                                            profile.full_name || '未設定'
                                        )}
                                    </td>
                                    {/* Alias column removed */}
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {isEditing ? (
                                            <select
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                            >
                                                <option value="user">一般使用者</option>
                                                <option value="admin">管理員</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${profile.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {profile.role === 'admin' ? '管理員' : '一般使用者'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                type="password"
                                                value={editForm.password}
                                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                                placeholder="重設密碼"
                                            />
                                        ) : (
                                            '********'
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSave(profile.id)}
                                                    disabled={isUpdating}
                                                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                                                >
                                                    {isUpdating ? '儲存中...' : '儲存'}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    disabled={isUpdating}
                                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(profile)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    編輯
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile.id)}
                                                    disabled={isDeleting === profile.id}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                >
                                                    {isDeleting === profile.id ? '刪除中...' : '刪除'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}
