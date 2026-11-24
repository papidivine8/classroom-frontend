import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import type { AppIdentity } from "@/provider mock/auth";
import { BACKEND_BASE_URL } from "@/constants";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@/types";

type DepartmentForm = {
    name: string;
    code: string;
    description: string;
};

const emptyForm: DepartmentForm = { name: "", code: "", description: "" };

const AdminDepartments = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<AppIdentity>();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [form, setForm] = useState<DepartmentForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (identity?.role !== "admin") {
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        fetch(`${BACKEND_BASE_URL}departments`, {
            credentials: "include",
            signal: controller.signal,
        }).then(async (response) => {
            const payload = await response.json() as { data?: Department[]; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not load departments");
            setDepartments(payload.data ?? []);
        }).catch((loadError: unknown) => {
            if (!controller.signal.aborted) {
                setError(loadError instanceof Error ? loadError.message : "Could not load departments");
            }
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoading(false);
        });
        return () => controller.abort();
    }, [identity?.role]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSaving(true);
        try {
            const response = await fetch(
                `${BACKEND_BASE_URL}departments${editingId ? `/${editingId}` : ""}`,
                {
                    method: editingId ? "PUT" : "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                },
            );
            const payload = await response.json() as { data?: Department; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not save department");
            const savedDepartment = payload.data;
            if (savedDepartment) {
                setDepartments((current) => editingId
                    ? current.map((department) => department.id === editingId ? savedDepartment : department)
                    : [...current, savedDepartment].sort((a, b) => a.name.localeCompare(b.name)));
            }
            setForm(emptyForm);
            setEditingId(null);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Could not save department");
        } finally {
            setIsSaving(false);
        }
    };

    const remove = async (id: number) => {
        setError("");
        try {
            const response = await fetch(`${BACKEND_BASE_URL}departments/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not delete department");
            setDepartments((current) => current.filter((department) => department.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setForm(emptyForm);
            }
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : "Could not delete department");
        }
    };

    if (identityLoading || isLoading) return <p>Loading departments...</p>;
    if (identity?.role !== "admin") {
        return <p role="alert">Only admins can manage departments. <Link className="underline" to="/login">Sign in</Link> with an admin account.</p>;
    }

    return (
        <div className="space-y-5">
            <Breadcrumb />
            <h1 className="page-title">Manage Departments</h1>
            <form onSubmit={submit} className="max-w-xl space-y-3 rounded-md border p-4">
                <h2 className="font-semibold">{editingId ? "Edit department" : "Add a department"}</h2>
                <div className="space-y-2"><Label htmlFor="department-name">Name</Label><Input id="department-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required minLength={2} maxLength={255} /></div>
                <div className="space-y-2"><Label htmlFor="department-code">Code</Label><Input id="department-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required minLength={2} maxLength={50} /></div>
                <div className="space-y-2"><Label htmlFor="department-description">Description</Label><Textarea id="department-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={255} /></div>
                <div className="flex gap-2">
                    <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingId ? "Save changes" : "Create department"}</Button>
                    {editingId !== null && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>}
                </div>
            </form>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
                {departments.map((department) => (
                    <div key={department.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                        <div><p className="font-medium">{department.name} <span className="text-muted-foreground">({department.code})</span></p><p className="text-sm text-muted-foreground">{department.description}</p></div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                                setEditingId(department.id);
                                setForm({ name: department.name, code: department.code ?? "", description: department.description ?? "" });
                            }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                                if (window.confirm(`Delete "${department.name}"?`)) void remove(department.id);
                            }}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDepartments;
