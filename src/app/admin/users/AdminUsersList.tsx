'use client'

import { useState } from 'react'
import { updateUserRole, updateUserName } from './actions'

type Profile = {
    id: string
    full_name: string | null
    role: string | null
}

export default function AdminUsersList({ profiles }: { profiles: Profile[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({
        full_name: '',
        role: 'user',
    })
    const [isUpdating, setIsUpdating] = useState(false)

    const handleEdit = (profile: Profile) => {
        setEditingId(profile.id)
        setEditForm({
            full_name: profile.full_name || '',
            role: profile.role || 'user',
        })
    }

    const handleSave = async (userId: string) => {
        setIsUpdating(true)
        try {
            await updateUserName(userId, editForm.full_name)
            await updateUserRole(userId, editForm.role as 'user' | 'admin')
            setEditingId(null)
            window.location.reload()
        } catch (error) {
            alert('更新使用者失敗: ' + (error as Error).message)
        } finally {
            setIsUpdating(false)
        }
    }

    if (!profiles || profiles.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                找不到使用者
            </div>
        )
    }

    return (
        <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        姓名
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        角色
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        ID
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
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono text-xs">
                                {profile.id.substring(0, 8)}...
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
                                    <button
                                        onClick={() => handleEdit(profile)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        編輯
                                    </button>
                                )}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}
