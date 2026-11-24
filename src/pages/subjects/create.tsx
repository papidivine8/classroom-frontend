import { useState } from "react";
import { useBack, useGetIdentity, useList } from "@refinedev/core";
import { Link } from "react-router";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_BASE_URL } from "@/constants";
import { Department } from "@/types";
import type { AppIdentity } from "@/provider mock/auth";

const SubjectsCreate = () => {
    const back = useBack();
    const { data: identity, isLoading: identityLoading } = useGetIdentity<AppIdentity>();
    const { query } = useList<Department>({ resource: "departments", pagination: { pageSize: 100 } });
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}subjects`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code, departmentId: Number(departmentId), description }),
            });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not create subject");
            back();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Could not create subject");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (identityLoading) return <p>Checking permissions...</p>;
    if (identity?.role !== "admin") {
        return <p role="alert">Only admins can create subjects. <Link className="underline" to="/login">Sign in</Link> with an admin account.</p>;
    }

    return (
        <CreateView>
            <Breadcrumb />
            <h1 className="page-title">Create a Subject</h1>
            <form onSubmit={submit} className="max-w-xl space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="subject-name">Name</Label>
                    <Input id="subject-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={3} maxLength={255} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject-code">Code</Label>
                    <Input id="subject-code" value={code} onChange={(event) => setCode(event.target.value)} required minLength={2} maxLength={50} />
                </div>
                <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId} disabled={query.isLoading}>
                        <SelectTrigger><SelectValue placeholder="Choose a department" /></SelectTrigger>
                        <SelectContent>
                            {query.data?.data.map((department) => (
                                <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject-description">Description</Label>
                    <Textarea id="subject-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} />
                </div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting || !departmentId}>
                        {isSubmitting ? "Creating..." : "Create Subject"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => back()}>Cancel</Button>
                </div>
            </form>
        </CreateView>
    );
};

export default SubjectsCreate;
