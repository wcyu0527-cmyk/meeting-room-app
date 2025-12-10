'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createUnit, updateUnit, deleteUnit, createUnitMember, deleteUnitMember } from './actions'

type Unit = {
    id: string
    name: string
    unit_members: { id: string; name: string }[]
}

export default function UnitList({ units }: { units: Unit[] }) {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)
    const [newUnitName, setNewUnitName] = useState('')
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
    const [editUnitName, setEditUnitName] = useState('')

    // Member management
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
    const [newMemberName, setNewMemberName] = useState('')

    const handleCreateUnit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUnitName.trim()) return

        const res = await createUnit(newUnitName)
        if (res.success) {
            setNewUnitName('')
            setIsCreating(false)
            router.refresh()
        } else {
            alert('建立單位失敗: ' + res.error)
        }
    }

    const handleUpdateUnit = async (id: string) => {
        if (!editUnitName.trim()) return

        const res = await updateUnit(id, editUnitName)
        if (res.success) {
            setEditingUnitId(null)
            setEditUnitName('')
            router.refresh()
        } else {
            alert('更新單位失敗: ' + res.error)
        }
    }

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('確定要刪除此單位嗎？所有成員也將被刪除。')) return

        const res = await deleteUnit(id)
        if (!res.success) {
            alert('刪除單位失敗: ' + res.error)
        } else {
            router.refresh()
        }
    }

    const handleAddMember = async (e: React.FormEvent, unitId: string) => {
        e.preventDefault()
        if (!newMemberName.trim()) return

        const res = await createUnitMember(unitId, newMemberName)
        if (res.success) {
            setNewMemberName('')
            router.refresh()
        } else {
            alert('新增成員失敗: ' + res.error)
        }
    }

    const handleDeleteMember = async (id: string) => {
        if (!confirm('確定要刪除此成員嗎？')) return

        const res = await deleteUnitMember(id)
        if (!res.success) {
            alert('刪除成員失敗: ' + res.error)
        } else {
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white px-4 py-5 border-b border-gray-200 sm:px-6 shadow sm:rounded-lg">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        單位列表
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        點擊「＋新增單位」建立新單位，或在各單位卡片內新增成員
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Add Unit Card */}
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
                    >
                        <svg
                            className="w-12 h-12 text-gray-400 group-hover:text-indigo-600 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span className="text-base font-medium text-gray-700 group-hover:text-indigo-900">
                            新增單位
                        </span>
                    </button>
                )}

                {/* Create Unit Card */}
                {isCreating && (
                    <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-indigo-500">
                        <div className="px-4 py-5 sm:px-6 bg-indigo-50">
                            <h4 className="text-md font-bold text-indigo-900">建立新單位</h4>
                        </div>
                        <div className="px-4 py-5">
                            <form onSubmit={handleCreateUnit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        單位名稱
                                    </label>
                                    <input
                                        type="text"
                                        value={newUnitName}
                                        onChange={(e) => setNewUnitName(e.target.value)}
                                        placeholder="例如：業務部"
                                        autoFocus
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900 bg-white"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreating(false)
                                            setNewUnitName('')
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        建立單位
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Existing Units */}
                {units.map((unit) => (
                    <div key={unit.id} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 hover:shadow-lg transition-shadow">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50">
                            {editingUnitId === unit.id ? (
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editUnitName}
                                        onChange={(e) => setEditUnitName(e.target.value)}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-1.5 border text-gray-900 bg-white"
                                    />
                                    <button onClick={() => handleUpdateUnit(unit.id)} className="text-green-600 hover:text-green-900 text-sm font-medium whitespace-nowrap">儲存</button>
                                    <button onClick={() => setEditingUnitId(null)} className="text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">取消</button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-lg font-semibold text-gray-900 truncate">{unit.name}</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUnitId(unit.id)
                                                setEditUnitName(unit.name)
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUnit(unit.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-sm font-medium text-gray-700">成員名單</h5>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {unit.unit_members.length} 人
                                </span>
                            </div>

                            <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                                {unit.unit_members.map((member) => (
                                    <li key={member.id} className="flex justify-between items-center text-sm bg-gray-50 rounded px-3 py-2 hover:bg-gray-100 transition-colors">
                                        <span className="text-gray-700 font-medium">{member.name}</span>
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
                                            title="刪除成員"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                                {unit.unit_members.length === 0 && <li className="text-gray-400 text-sm italic text-center py-2">尚無成員</li>}
                            </ul>

                            <div className="border-t border-gray-200 pt-3">
                                <form onSubmit={(e) => handleAddMember(e, unit.id)} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={selectedUnitId === unit.id ? newMemberName : ''}
                                        onChange={(e) => {
                                            setSelectedUnitId(unit.id)
                                            setNewMemberName(e.target.value)
                                        }}
                                        placeholder="輸入成員姓名"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                                    >
                                        ＋新增
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
