import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useLogin, useRegister } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthPageProps = {
    mode: "login" | "register";
};

const AuthPage = ({ mode }: AuthPageProps) => {
    const navigate = useNavigate();
    const { mutateAsync: login } = useLogin<{ email: string; password: string }>();
    const { mutateAsync: register } = useRegister<{ name: string; email: string; password: string }>();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const result = mode === "login"
                ? await login({ email, password })
                : await register({ name, email, password });
            if (!result.success) {
                throw result.error instanceof Error ? result.error : new Error("Authentication failed");
            }
            navigate(result.redirectTo ?? "/");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Authentication failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">{mode === "login" ? "Sign in" : "Create an account"}</h1>
                <p className="text-muted-foreground">
                    {mode === "login" ? "Sign in to join a class or manage your classes." : "New accounts are registered as students."}
                </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                    <div className="space-y-2">
                        <Label htmlFor="auth-name">Name</Label>
                        <Input id="auth-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="auth-email">Email</Label>
                    <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <Input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
                </div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}
                </Button>
            </form>
            <p className="text-sm">
                {mode === "login" ? "Need an account? " : "Already registered? "}
                <Link className="underline" to={mode === "login" ? "/register" : "/login"}>
                    {mode === "login" ? "Register" : "Sign in"}
                </Link>
            </p>
        </main>
    );
};

export default AuthPage;
