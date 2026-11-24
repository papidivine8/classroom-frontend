import { ShowView, ShowViewHeader } from '@/components/refine-ui/views/show-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ClassDetails } from '@/types'
import { useGetIdentity, useShow } from '@refinedev/core'
import { useState, type FormEvent } from 'react'
import { AdvancedImage } from '@cloudinary/react';
import { bannerPhoto } from '@/lib/cloudinary';
import { BACKEND_BASE_URL } from '@/constants';
import { Link } from 'react-router';
import type { AppIdentity } from '@/provider mock/auth';

const Show = () => {
    const { query } = useShow<ClassDetails>({ resource: 'classes' });
    const { data: identity } = useGetIdentity<AppIdentity>();
    const [inviteCode, setInviteCode] = useState("");
    const [joinMessage, setJoinMessage] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const classDetails = query.data?.data;
    const { isLoading, isError } = query;

    if (isLoading || isError || !classDetails) {
        return (
            <ShowView className='class-view class-show'>
                <ShowViewHeader resource='classes' title='Class Details' />

                <p className='state-message'>
                    {isLoading ? 'Loading class details...'
                        : isError ? 'Failed to load class details...'
                            : 'Class details not found'}
                </p>
            </ShowView>
        )
    }

    const teacherName = classDetails.teacher?.name ?? 'Unknown';
    const teachersInitials = teacherName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase()).join('')

    const placeholderUrl = `https://placehold.co/600x400?text=${encodeURIComponent(teachersInitials || 'NA')}`;

    const { name, description, status, capacity,
        bannerUrl, bannerCldPubId, subject, teacher, department,} = classDetails;
    const canManage = identity?.role === "admin" ||
        (identity?.role === "teacher" && identity.id === classDetails.teacherId);

    const joinClass = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setJoinMessage("");
        setIsJoining(true);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}classes/join`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Could not join class");
            setJoinMessage("You have joined the class.");
        } catch (error) {
            setJoinMessage(error instanceof Error ? error.message : "Could not join class");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <ShowView className='class-view class-show'>
            <ShowViewHeader resource='classes' title='Class Details' showEditButton={canManage} />

            <div className='banner'>
                {bannerUrl ? 
                    <AdvancedImage alt="Class Banner" cldImg={bannerPhoto
                    (bannerCldPubId ?? '', name)}/> : <div className='placeholder' />}
            </div>

            <Card className='details-card'>
                <div className='details-header'>
                    <div>
                        <h1>{name}</h1>
                        <p>{description}</p>
                    </div>

                    <div>
                        <Badge variant='outline'>{classDetails.enrollmentCount ?? 0} / {capacity} spots</Badge>
                        <Badge variant={status === 'active' ? 'default' :
                            'secondary'} data-status={status}>{status.toUpperCase()}</Badge>
                    </div>
                </div>

                <div className='details-grid'>
                    <div className='instructor'>
                        <p>Instructor</p>
                        <div>
                            <img src={teacher?.image ?? placeholderUrl} 
                            alt={teacherName}/>

                            <div>
                                <p>{teacherName}</p>
                            </div>
                        </div>
                    </div>

                    <div className='department'>
                            <p>Department</p>

                            <div>
                                <p>{department?.name}</p>
                                <p>{department?.description}</p>
                            </div>
                    </div>
                </div>

                <Separator />

                <div className='subject'>
                    <p>Subject</p>

                    <div>
                        <Badge variant='outline'>Code: {subject?.code}</Badge>
                        <p>{subject?.name}</p>
                        <p>{subject?.description}</p>
                    </div>
                </div>

                <Separator />

                <div className='join'>
                    <h2>Join Class</h2>

                    <ol>
                        <li>Ask your teacher for the invite code</li>
                        <li>Click on "Join Class" button</li>
                        <li>Paste the code and click "join"</li>
                    </ol>
                    <p className="mt-2 text-sm">
                        You need a student account to join. <Link className="underline" to="/login">Sign in</Link>
                        {" or "}<Link className="underline" to="/register">register</Link>.
                    </p>
                </div>

                <form onSubmit={joinClass} className="space-y-3">
                    <label htmlFor="invite-code" className="sr-only">Invite code</label>
                    <input
                        id="invite-code"
                        className="w-full rounded-md border bg-background px-3 py-2"
                        value={inviteCode}
                        onChange={(event) => setInviteCode(event.target.value)}
                        placeholder="Enter your invite code"
                        required
                    />
                    {joinMessage && <p role="status" className="text-sm">{joinMessage}</p>}
                    <Button type="submit" size='lg' className='w-full' disabled={isJoining}>
                        {isJoining ? "Joining..." : "Join Class"}
                    </Button>
                </form>
            </Card>
        </ShowView>
    )
}

export default Show