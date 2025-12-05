import LoginForm from './LoginForm'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string; error: string }
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-4xl font-bold text-indigo-600 mb-8">
                    中工段會議室系統
                </h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <LoginForm
                        error={searchParams?.error}
                        message={searchParams?.message}
                    />
                </div>
            </div>
        </div>
    )
}
