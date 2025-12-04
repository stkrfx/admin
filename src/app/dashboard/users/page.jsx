'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUsers, deleteUser, toggleUserBan, bulkDeleteUsers, bulkToggleUserBan } from '@/actions/user';
import {
    Search, Ban, Trash2, MoreHorizontal, ArrowUpDown,
    Mail, MessageSquare, CheckCircle, XCircle, UserPlus, Loader2, Clock
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DialogConfirm from '@/components/DialogConfirm';
import { toast } from 'sonner';

export default function UsersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filters
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [search, setSearch] = useState('');
    const [isStaleFilter, setIsStaleFilter] = useState(false); // New "Stale" Filter

    // Pagination State
    const [pagination, setPagination] = useState({
        pageIndex: 0, // table uses 0-based index
        pageSize: 25,
    });
    const [pageCount, setPageCount] = useState(0);

    // Data State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', action: null, variant: 'default' });
    const [actionLoading, setActionLoading] = useState(false);

    // 1. FETCH DATA
    useEffect(() => {
        // Sync URL (Optional: Debounce this if needed)
        const params = new URLSearchParams();
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (isStaleFilter) params.set('filter', 'stale');
        router.replace(`?${params.toString()}`, { scroll: false });

        async function load() {
            setLoading(true);
            try {
                const res = await getUsers({
                    role: roleFilter === 'all' ? '' : roleFilter,
                    status: statusFilter === 'all' ? '' : statusFilter,
                    q: search,
                    page: pagination.pageIndex + 1, // Server expects 1-based
                    limit: pagination.pageSize,
                    filterType: isStaleFilter ? 'stale' : undefined
                });

                if (!res.error) {
                    setUsers(res.users || []);
                    setPageCount(res.pagination?.pages || 0);
                }
            } catch (e) {
                toast.error("Failed to load users");
            } finally {
                setLoading(false);
            }
        }

        const debounce = setTimeout(load, 400);
        return () => clearTimeout(debounce);
    }, [roleFilter, statusFilter, search, pagination, isStaleFilter, router]);

    // --- ACTIONS ---
    const openActionDialog = (config) => {
        setDialogConfig(config);
        setDialogOpen(true);
    };

    const executeDialogAction = async () => {
        if (!dialogConfig.action) return;
        setActionLoading(true);
        try {
            await dialogConfig.action();
            setDialogOpen(false);
            // Trigger reload to refresh list after action
            setPagination(prev => ({ ...prev }));
        } catch (e) {
            toast.error("Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    // --- COLUMNS ---
    const columns = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-slate-300 data-[state=checked]:bg-slate-900"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="border-slate-300 data-[state=checked]:bg-slate-900"
                />
            ),
            enableSorting: false,
        },
        {
            accessorKey: "user",
            header: "User Details",
            cell: ({ row }) => {
                const u = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                            <AvatarImage src={u.photo} alt={u.name} />
                            <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-xs">
                                {u.name?.[0] || u.email[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm">{u.name || 'Unnamed'}</span>
                            <span className="text-xs text-slate-500 font-mono">{u.email}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const role = row.getValue("role");
                const styles = {
                    expert: "bg-purple-50 text-purple-700 border-purple-200",
                    organisation: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    admin: "bg-slate-100 text-slate-700 border-slate-200",
                    user: "bg-blue-50 text-blue-700 border-blue-200"
                };
                return <Badge variant="outline" className={`${styles[role]} capitalize shadow-sm`}>{role}</Badge>
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const u = row.original;
                if (u.isBanned) return <Badge variant="destructive" className="gap-1 shadow-sm"><Ban size={10} /> Banned</Badge>;
                if (u.isVerified) return <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 gap-1 shadow-sm"><CheckCircle size={10} /> Verified</Badge>;
                return <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 gap-1 shadow-sm"><XCircle size={10} /> Unverified</Badge>;
            },
        },
        {
            accessorKey: "createdAt",
            header: "Joined",
            cell: ({ row }) => <span className="text-slate-500 text-xs">{new Date(row.getValue("createdAt")).toLocaleDateString()}</span>,
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4 text-slate-500" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/chat?userId=${user._id}`} className="cursor-pointer"><MessageSquare size={14} className="mr-2" /> Chat</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={`mailto:${user.email}`} className="cursor-pointer"><Mail size={14} className="mr-2" /> Email</a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => openActionDialog({
                                    title: user.isBanned ? "Unban Account" : "Ban Account",
                                    message: `Are you sure you want to ${user.isBanned ? 'activate' : 'suspend'} ${user.email}?`,
                                    confirmText: user.isBanned ? "Unban User" : "Ban User",
                                    variant: user.isBanned ? "success" : "destructive",
                                    icon: user.isBanned ? "check" : "ban",
                                    action: async () => {
                                        const res = await toggleUserBan(user.email, !user.isBanned);
                                        if (res.success) {
                                            setUsers(prev => prev.map(u => u.email === user.email ? { ...u, isBanned: !u.isBanned } : u));
                                            toast.success(`User ${user.isBanned ? 'unbanned' : 'banned'}`);
                                        } else toast.error(res.error);
                                    }
                                })}
                                className={user.isBanned ? "text-green-600 focus:bg-green-50" : "text-amber-600 focus:bg-amber-50"}
                            >
                                {user.isBanned ? <><CheckCircle size={14} className="mr-2" /> Unban User</> : <><Ban size={14} className="mr-2" /> Ban User</>}
                            </DropdownMenuItem>
                            {!user.isVerified && (
                                <DropdownMenuItem
                                    onClick={() => openActionDialog({
                                        title: "Delete User",
                                        message: "This action is strictly irreversible. The user will be permanently removed.",
                                        confirmText: "Delete Forever",
                                        variant: "destructive",
                                        icon: "trash",
                                        action: async () => {
                                            const res = await deleteUser(user._id);
                                            if (res.success) {
                                                setUsers(prev => prev.filter(u => u._id !== user._id));
                                                toast.success("User deleted");
                                            } else toast.error(res.error);
                                        }
                                    })}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                    <Trash2 size={14} className="mr-2" /> Delete User
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [users]);

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>User Management</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage accounts, permissions, and status.</p>
                </div>
                <div className="flex gap-2">
                    {/* Stale Filter Toggle */}
                    <Button
                        variant={isStaleFilter ? "destructive" : "outline"}
                        onClick={() => setIsStaleFilter(!isStaleFilter)}
                        className="gap-2"
                    >
                        <Clock size={16} />
                        {isStaleFilter ? "Clear Stale Filter" : "Old Unverified"}
                    </Button>

                    <Link href="/dashboard/users/create">
                        <Button className="bg-slate-900 gap-2"><UserPlus size={18} /> Create New User</Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-48 bg-slate-50"><SelectValue placeholder="All Roles" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="expert">Experts</SelectItem>
                        <SelectItem value="organisation">Organisations</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48 bg-slate-50"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Table with Server Pagination */}
            <DataTable
                columns={columns}
                data={users}
                pageCount={pageCount}
                pagination={pagination}
                onPaginationChange={setPagination}
                renderBulkActions={({ selectedRows, resetSelection }) => (
                    <>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-slate-700/50 hover:text-white" onClick={() => {
                            // Handle Bulk Ban
                            openActionDialog({
                                title: `Ban ${selectedRows.length} Users`,
                                message: "This will suspend all selected users. Continue?",
                                confirmText: "Ban Selected",
                                variant: "destructive",
                                icon: "ban",
                                action: async () => {
                                    const emails = selectedRows.map(u => u.email);
                                    await bulkToggleUserBan(emails, true);
                                    setPagination({ ...pagination }); // Reload
                                    resetSelection();
                                    toast.success("Users banned");
                                }
                            });
                        }}>
                            <Ban size={14} className="mr-2" /> Ban Selected
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-900/30 hover:text-red-200" onClick={() => {
                            // Handle Bulk Delete
                            const unverified = selectedRows.filter(u => !u.isVerified);
                            if (unverified.length === 0) return toast.error("Only unverified users can be deleted.");
                            openActionDialog({
                                title: `Delete ${unverified.length} Users`,
                                message: "Deleting unverified users is permanent.",
                                confirmText: "Delete",
                                variant: "destructive",
                                icon: "trash",
                                action: async () => {
                                    const ids = unverified.map(u => u._id);
                                    await bulkDeleteUsers(ids);
                                    setPagination({ ...pagination }); // Reload
                                    resetSelection();
                                    toast.success("Users deleted");
                                }
                            });
                        }}>
                            <Trash2 size={14} className="mr-2" /> Delete Unverified
                        </Button>
                    </>
                )}
            />

            <DialogConfirm
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                variant={dialogConfig.variant}
                icon={dialogConfig.icon}
                onConfirm={executeDialogAction}
                isLoading={actionLoading}
            />
        </div>
    );
}