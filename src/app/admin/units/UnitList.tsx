'use client'

import { useState } from 'react'
import { createUnit, updateUnit, deleteUnit, createUnitMember, deleteUnitMember } from './actions'

type Unit = {
    id: string
    name: string
    unit_members: { id: string; name: string }[]
}

export default function UnitList({ units }: { units: Unit[] }) {
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
        } else {
            alert('更新單位失敗: ' + res.error)
        }
    }

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('確定要刪除此單位嗎？所有成員也將被刪除。')) return

        const res = await deleteUnit(id)
        if (!res.success) {
            alert('刪除單位失敗: ' + res.error)
        }
    }

    const handleAddMember = async (e: React.FormEvent, unitId: string) => {
        e.preventDefault()
        if (!newMemberName.trim()) return

        const res = await createUnitMember(unitId, newMemberName)
        if (res.success) {
            setNewMemberName('')
        } else {
            alert('新增成員失敗: ' + res.error)
        }
    }

    const handleDeleteMember = async (id: string) => {
        if (!confirm('確定要刪除此成員嗎？')) return

        const res = await deleteUnitMember(id)
        if (!res.success) {
            alert('刪除成員失敗: ' + res.error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white px-4 py-5 border-b border-gray-200 sm:px-6 shadow sm:rounded-lg">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    單位列表
                </h3>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {isCreating ? '取消' : '新增單位'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 shadow sm:rounded-lg">
                    <form onSubmit={handleCreateUnit} className="flex gap-4">
                        <input
                            type="text"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            placeholder="輸入單位名稱"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            確認新增
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {units.map((unit) => (
                    <div key={unit.id} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            {editingUnitId === unit.id ? (
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editUnitName}
                                        onChange={(e) => setEditUnitName(e.target.value)}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-1 border text-gray-900 bg-white"
                                    />
                                    <button onClick={() => handleUpdateUnit(unit.id)} className="text-green-600 hover:text-green-900 text-sm">儲存</button>
                                    <button onClick={() => setEditingUnitId(null)} className="text-gray-600 hover:text-gray-900 text-sm">取消</button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-lg font-medium text-gray-900 truncate">{unit.name}</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUnitId(unit.id)
                                                setEditUnitName(unit.name)
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUnit(unit.id)}
                                            className="text-red-600 hover:text-red-900 text-sm"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="px-4 py-4 sm:px-6">
                            <h5 className="text-sm font-medium text-gray-500 mb-3">成員名單 ({unit.unit_members.length})</h5>

                            <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                                {unit.unit_members.map((member) => (
                                    <li key={member.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700">{member.name}</span>
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                                {unit.unit_members.length === 0 && <li className="text-gray-400 text-sm italic">無成員</li>}
                            </ul>

                            <form onSubmit={(e) => handleAddMember(e, unit.id)} className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={selectedUnitId === unit.id ? newMemberName : ''}
                                    onChange={(e) => {
                                        setSelectedUnitId(unit.id)
                                        setNewMemberName(e.target.value)
                                    }}
                                    placeholder="新增成員姓名"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-xs border-gray-300 rounded-md p-1.5 border text-gray-900 bg-white"
                                />
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    新增
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
