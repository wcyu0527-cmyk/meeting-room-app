import SignupForm from './SignupForm'

export default function SignupPage({
    searchParams,
}: {
    searchParams: { message: string; error: string }
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-4xl font-bold text-indigo-600 mb-2">
                    中工段會議室系統
                </h1>
                <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
                    Create your account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <SignupForm
                        error={searchParams?.error}
                        message={searchParams?.message}
                    />
                </div>
            </div>
        </div>
    )
}
