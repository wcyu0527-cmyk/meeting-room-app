'use client'

import { useState } from 'react'
import { createUser } from './actions'

export default function CreateUserForm() {
    const [message, setMessage] = useState('')
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setMessage('')

        const id = formData.get('id') as string
        const password = formData.get('password') as string
        const name = formData.get('name') as string
        // Alias is optional in the logic, but let's assume it's same as name if not provided or just use name for now as the form only has name.
        // Wait, the action expects `alias` but the form in view_file earlier didn't show an input for alias.
        // Let's check the form again in previous turn... it has id, password, name.
        // I'll use name as alias for now or add an empty string. The action signature is (username, password, full_name, alias).

        const res = await createUser(id, password, name, name)
        setIsPending(false)

        if (res?.error) {
            setMessage('錯誤: ' + res.error)
        } else {
            setMessage('成功新增使用者！')
            // Reset form
            const form = document.getElementById('create-user-form') as HTMLFormElement
            if (form) form.reset()
        }
    }

    return (
        <form id="create-user-form" action={handleSubmit} className="space-y-4 max-w-md">
            <div>
                <label className="block text-sm font-medium text-gray-700">使用者 ID</label>
                <input
                    name="id"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="例如: user123"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">密碼</label>
                <input
                    name="password"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="初始密碼"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">名稱</label>
                <input
                    name="name"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="例如: 王小明"
                />
            </div>

            {message && (
                <div className={`p-3 rounded text-sm ${message.includes('錯誤') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isPending ? '處理中...' : '新增使用者'}
            </button>
        </form>
    )
}
