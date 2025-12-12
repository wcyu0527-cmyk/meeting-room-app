import LoginForm from './LoginForm'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string; error: string }
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-4xl font-bold text-primary mb-8">
                    臺中工務段會議室
                </h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
                    <LoginForm
                        error={searchParams?.error}
                        message={searchParams?.message}
                    />
                </div>
            </div>
        </div>
    )
}
