import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useGetIdentity } from "@refinedev/core";
import { AppIdentity } from "@/provider mock/auth";
import { BACKEND_BASE_URL } from "@/constants";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { ClassDetails } from "@/types";

const MyClasses = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<AppIdentity>();
    const [classes, setClasses] = useState<ClassDetails[]>([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [leavingClassId, setLeavingClassId] = useState<number | null>(null);

    const loadClasses = useCallback(async (signal?: AbortSignal) => {
        const response = await fetch(`${BACKEND_BASE_URL}classes/enrolled`, {
            credentials: "include",
            signal,
        });
        const payload = await response.json() as { data?: ClassDetails[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not load your classes");
        setClasses(payload.data ?? []);
    }, []);

    useEffect(() => {
        if (!identity || identity.role !== "student") {
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        loadClasses(controller.signal).catch((loadError: unknown) => {
            if (!controller.signal.aborted) {
                setError(loadError instanceof Error ? loadError.message : "Could not load your classes");
            }
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoading(false);
        });
        return () => controller.abort();
    }, [identity, loadClasses]);

    const leaveClass = async (classId: number) => {
        setError("");
        setLeavingClassId(classId);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}classes/${classId}/enrollment`, {
                method: "DELETE",
                credentials: "include",
            });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not leave class");
            setClasses((current) => current.filter((classItem) => classItem.id !== classId));
        } catch (leaveError) {
            setError(leaveError instanceof Error ? leaveError.message : "Could not leave class");
        } finally {
            setLeavingClassId(null);
        }
    };

    if (identityLoading || isLoading) return <p>Loading your classes...</p>;
    if (identity?.role !== "student") {
        return <p role="alert">Sign in with a student account to see your enrollments. <Link className="underline" to="/login">Sign in</Link>.</p>;
    }

    return (
        <div className="space-y-4">
            <Breadcrumb />
            <h1 className="page-title">My Classes</h1>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="space-y-3">
                {classes.map((classItem) => (
                    <div key={classItem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                        <div>
                            <Link className="font-medium underline" to={`/classes/show/${classItem.id}`}>{classItem.name}</Link>
                            <p className="text-sm text-muted-foreground">
                                {classItem.subject?.name ?? "Subject"} · {classItem.teacher?.name ?? "Teacher"}
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={leavingClassId === classItem.id}
                            onClick={() => leaveClass(classItem.id)}
                        >
                            {leavingClassId === classItem.id ? "Leaving..." : "Leave class"}
                        </Button>
                    </div>
                ))}
                {classes.length === 0 && <p>You are not enrolled in any classes yet.</p>}
            </div>
        </div>
    );
};

export default MyClasses;
