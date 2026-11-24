import { CreateButton } from "@/components/refine-ui/buttons/create"
import { DataTable } from "@/components/refine-ui/data-table/data-table"
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb"
import { ListView } from "@/components/refine-ui/views/list-view"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useMemo, useState } from "react"
import { useTable } from "@refinedev/react-table"
import { Department, Subject } from "@/types"
import { ColumnDef, Row } from "@tanstack/react-table"
import { useGetIdentity, useList } from "@refinedev/core"
import { EditButton } from "@/components/refine-ui/buttons/edit"
import { DeleteButton } from "@/components/refine-ui/buttons/delete"
import type { AppIdentity } from "@/provider mock/auth"

const SubjectsList = () => {
    const [seacrhQuery, setSeacrhQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const { data: identity } = useGetIdentity<AppIdentity>();
    const { query: departmentsQuery } = useList<Department>({
        resource: "departments",
        pagination: { pageSize: 100 },
    });

    const departmentFilters = selectedDepartment === 'all' ? [] : [
        { 
            field: 'department',
            operator: 'eq' as const,
            value: selectedDepartment
         }
    ]
    const seacrhFilters = seacrhQuery ? [
        {
            field: 'name',
            operator: 'contains' as const,
            value: seacrhQuery
        }
    ] : [];

    const subjectTable = useTable<Subject>({
        columns: useMemo<ColumnDef<Subject>[]>(() => [
            { id: 'code',
                accessorKey: 'code',
                size: 100,
                header: () => <p className="column-title ml-2">Code</p>,
                cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>
             },
             {  id: 'name',
                accessorKey: 'name',
                size: 200,
                header: () => <p className="column-title">Name</p>,
                cell: ({ getValue }) => <span
                className="text-foreground">{getValue<string>()}</span>,
                filterFn: 'includesString'
             },
             {
                id: 'department',
                accessorKey: 'department.name',
                size: 150,
                header: () => <p className="column-title">Department</p>,
                cell: ({ getValue }) => <Badge 
                variant="secondary">{getValue<String>()}</Badge>
             },
             {
                id: 'description',
                accessorKey: 'description',
                size: 300,
                header: () => <p className="column-title">Description</p>,
                cell: ({ getValue }) => <span 
                className="truncate line-clamp-2">{getValue<String>()}</span>
             },
             ...(identity?.role === "admin" ? [{
                id: 'actions',
                header: () => <p className="column-title">Actions</p>,
                cell: ({ row }: { row: Row<Subject> }) => (
                    <div className="flex gap-2">
                        <EditButton resource="subjects" recordItemId={row.original.id} size="sm" />
                        <DeleteButton resource="subjects" recordItemId={row.original.id} size="sm" />
                    </div>
                ),
             }] : [])
             
        ], [identity?.role]),
        refineCoreProps: {
            resource: 'subjects',
            pagination: { pageSize: 10, mode: 'server' },
            filters: {
                permanent: [...departmentFilters, ...seacrhFilters]
            },
            sorters: {
                initial: [
                    { field: 'id', order: 'desc' },
                ]
            },
        }
});

    return (
        <ListView>
            <Breadcrumb />

            <h1 className="page-title">Subjects</h1>

            <div className="intro-row">
                <p>Quick access to essential metrics and management tools.</p>

                <div className="actions-row">
                    <div className="search-field">
                        <Search className="search-icon" />

                        <Input 
                            type="text"
                            placeholder="Search by name..."
                            className="pl-10 w-full"
                            value={seacrhQuery}
                            onChange={(e) => setSeacrhQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Select 
                        value={selectedDepartment}
                        onValueChange={setSelectedDepartment}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Department"/>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    All Departments
                                </SelectItem>
                                {departmentsQuery.data?.data.map(department => (
                                    <SelectItem key={department.id} 
                                    value={department.name}>
                                        {department.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {identity?.role === "admin" && <CreateButton resource="subjects" />}
                    </div>
                </div>
            </div>
            <DataTable table={subjectTable} />
        </ListView>
    )
}

export default SubjectsList