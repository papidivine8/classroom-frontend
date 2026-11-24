import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useGetIdentity, useList, useShow } from "@refinedev/core";
import { Link } from "react-router";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_BASE_URL } from "@/constants";
import { ClassDetails, Subject } from "@/types";
import type { AppIdentity } from "@/provider mock/auth";

const ClassEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: identity, isLoading: identityLoading } = useGetIdentity<AppIdentity>();
    const { query } = useShow<ClassDetails>({ resource: "classes", id });
    const subjectsQuery = useList<Subject>({ resource: "subjects", pagination: { pageSize: 100 } }).query;
    const classDetails = query.data?.data;
    const [name, setName] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [capacity, setCapacity] = useState("");
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const [description, setDescription] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [bannerCldPubId, setBannerCldPubId] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [inviteCodeError, setInviteCodeError] = useState("");
    const [enrolledStudents, setEnrolledStudents] = useState<{ id: string; name: string }[]>([]);
    const [enrollmentError, setEnrollmentError] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!classDetails) return;
        setName(classDetails.name);
        setSubjectId(String(classDetails.subjectId));
        setCapacity(String(classDetails.capacity));
        setStatus(classDetails.status === "inactive" ? "inactive" : "active");
        setDescription(classDetails.description ?? "");
        setBannerUrl(classDetails.bannerUrl ?? "");
        setBannerCldPubId(classDetails.bannerCldPubId ?? "");
    }, [classDetails]);

    useEffect(() => {
        if (!id) return;
        let isCurrent = true;
        fetch(`${BACKEND_BASE_URL}classes/${id}/invite-code`, { credentials: "include" })
            .then(async (response) => {
                const payload = await response.json() as { data?: { inviteCode?: string }; error?: string };
                if (!isCurrent) return;
                if (!response.ok) {
                    if (response.status !== 403) {
                        setInviteCodeError(payload.error ?? "Could not load invite code");
                    }
                    return;
                }
                setInviteCode(payload.data?.inviteCode ?? "");
            })
            .catch((error: unknown) => {
                console.error("Could not load class invite code:", error);
                if (isCurrent) setInviteCodeError("Could not load invite code");
            });
        return () => { isCurrent = false; };
    }, [id]);

    useEffect(() => {
        const canManage = identity?.role === "admin" ||
            (identity?.role === "teacher" && identity.id === classDetails?.teacherId);
        if (!id || !canManage) return;

        let isCurrent = true;
        fetch(`${BACKEND_BASE_URL}classes/${id}/enrollments`, { credentials: "include" })
            .then(async (response) => {
                const payload = await response.json() as { data?: { id: string; name: string }[]; error?: string };
                if (!isCurrent) return;
                if (!response.ok) throw new Error(payload.error ?? "Could not load enrolled students");
                setEnrolledStudents(payload.data ?? []);
            })
            .catch((loadError: unknown) => {
                if (isCurrent) setEnrollmentError(loadError instanceof Error ? loadError.message : "Could not load enrolled students");
            });
        return () => { isCurrent = false; };
    }, [id, identity?.id, identity?.role, classDetails?.teacherId]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!id) return;
        setError("");
        setIsSubmitting(true);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}classes/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    subjectId: Number(subjectId),
                    capacity: Number(capacity),
                    status,
                    description,
                    bannerUrl: bannerUrl || null,
                    bannerCldPubId: bannerCldPubId || null,
                }),
            });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not update class");
            navigate(`/classes/show/${id}`);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Could not update class");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (identityLoading || query.isLoading) return <p>Checking access...</p>;
    if (!identity || !classDetails ||
        (identity.role !== "admin" && !(identity.role === "teacher" && identity.id === classDetails.teacherId))) {
        return <p role="alert">You do not have permission to edit this class. <Link className="underline" to="/login">Sign in</Link> with the class teacher account.</p>;
    }

    return (
        <CreateView>
            <Breadcrumb />
            <h1 className="page-title">Edit Class</h1>
            {query.isLoading ? <p>Loading class...</p> : query.isError ? <p role="alert">Could not load class.</p> : (
                <form onSubmit={submit} className="max-w-xl space-y-4">
                    <div className="space-y-2"><Label htmlFor="class-name">Class name</Label><Input id="class-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={255} /></div>
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={subjectId} onValueChange={setSubjectId}>
                            <SelectTrigger><SelectValue placeholder="Choose a subject" /></SelectTrigger>
                            <SelectContent>{subjectsQuery.data?.data.map((subject) => <SelectItem key={subject.id} value={String(subject.id)}>{subject.name} ({subject.code})</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="class-capacity">Capacity</Label><Input id="class-capacity" type="number" min={1} step={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} required /></div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as "active" | "inactive")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="class-description">Description</Label><Textarea id="class-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="class-banner-url">Banner URL</Label><Input id="class-banner-url" type="url" value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="class-banner-id">Cloudinary public ID</Label><Input id="class-banner-id" value={bannerCldPubId} onChange={(event) => setBannerCldPubId(event.target.value)} /></div>
                    {inviteCode && <div className="space-y-2"><Label htmlFor="class-invite-code">Student invite code</Label><Input id="class-invite-code" value={inviteCode} readOnly /><p className="text-sm text-muted-foreground">Share this code only with students you want to enroll.</p></div>}
                    {inviteCodeError && <p role="alert" className="text-sm text-destructive">{inviteCodeError}</p>}
                    <section className="space-y-2 rounded-md border p-3">
                        <h2 className="font-semibold">Enrolled students ({enrolledStudents.length})</h2>
                        {enrollmentError && <p role="alert" className="text-sm text-destructive">{enrollmentError}</p>}
                        {enrolledStudents.length
                            ? <ul className="list-inside list-disc">{enrolledStudents.map((student) => <li key={student.id}>{student.name}</li>)}</ul>
                            : <p className="text-sm text-muted-foreground">No students are enrolled yet.</p>}
                    </section>
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2"><Button type="submit" disabled={isSubmitting || !subjectId}>{isSubmitting ? "Saving..." : "Save Class"}</Button><Button type="button" variant="outline" onClick={() => navigate(`/classes/show/${id}`)}>Cancel</Button></div>
                </form>
            )}
        </CreateView>
    );
};

export default ClassEdit;
