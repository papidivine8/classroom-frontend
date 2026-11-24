import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { AppIdentity } from "@/provider mock/auth";
import { BACKEND_BASE_URL } from "@/constants";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ManagedUser = {
    id: string;
    name: string;
    email: string;
    role: AppIdentity["role"];
};

const AdminUsers = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<AppIdentity>();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<Record<string, ManagedUser["role"]>>({});
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState("");

    useEffect(() => {
        if (identity?.role !== "admin") {
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        fetch(`${BACKEND_BASE_URL}users/admin`, {
            credentials: "include",
            signal: controller.signal,
        }).then(async (response) => {
            const payload = await response.json() as { data?: ManagedUser[]; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not load users");
            setUsers(payload.data ?? []);
            setRoles(Object.fromEntries((payload.data ?? []).map((user) => [user.id, user.role])));
        }).catch((loadError: unknown) => {
            if (!controller.signal.aborted) {
                setError(loadError instanceof Error ? loadError.message : "Could not load users");
            }
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoading(false);
        });

        return () => controller.abort();
    }, [identity?.role]);

    const saveRole = async (id: string) => {
        setError("");
        setSavingId(id);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}users/admin/${id}/role`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: roles[id] }),
            });
            const payload = await response.json() as { data?: ManagedUser; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not update role");
            const updatedUser = payload.data;
            if (updatedUser) {
                setUsers((current) => current.map((user) => user.id === id ? updatedUser : user));
            }
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Could not update role");
        } finally {
            setSavingId("");
        }
    };

    if (identityLoading || isLoading) return <p>Loading user management...</p>;
    if (identity?.role !== "admin") {
        return <p role="alert">Only admins can manage user roles. <Link className="underline" to="/login">Sign in</Link> with an admin account.</p>;
    }

    return (
        <div className="space-y-4">
            <Breadcrumb />
            <h1 className="page-title">Manage Users</h1>
            <p className="text-muted-foreground">Assign roles carefully. Admin access grants management privileges.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={roles[user.id] ?? user.role}
                                onValueChange={(role) => setRoles((current) => ({
                                    ...current,
                                    [user.id]: role as ManagedUser["role"],
                                }))}
                            >
                                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                size="sm"
                                disabled={savingId === user.id || roles[user.id] === user.role}
                                onClick={() => saveRole(user.id)}
                            >
                                {savingId === user.id ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                ))}
                {users.length === 0 && <p>No registered users yet.</p>}
            </div>
        </div>
    );
};

export default AdminUsers;
