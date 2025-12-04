"use client"

import { MoreHorizontal, ArrowUpDown, Ban, Trash2, Mail, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toggleUserBan, deleteUser } from "@/actions/user"
import { toast } from "sonner" // Assuming you use Sonner for toasts
import Link from "next/link"

export const columns = [
  {
    accessorKey: "user",
    header: "User Details",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-slate-100">
            <AvatarImage src={u.photo} alt={u.name} />
            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
              {u.name?.[0] || u.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 text-sm">{u.name || 'Unnamed'}</span>
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
        expert: "bg-purple-50 text-purple-700 border-purple-100",
        organisation: "bg-indigo-50 text-indigo-700 border-indigo-100",
        admin: "bg-slate-100 text-slate-700 border-slate-200",
        user: "bg-blue-50 text-blue-700 border-blue-100"
      };
      return (
        <Badge variant="outline" className={`${styles[role]} capitalize font-medium`}>
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const u = row.original;
      if (u.isBanned) {
        return <Badge variant="destructive" className="gap-1"><Ban size={10} /> Banned</Badge>;
      }
      if (u.isVerified) {
        return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 gap-1"><CheckCircle size={10} /> Verified</Badge>;
      }
      return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-100 gap-1"><XCircle size={10} /> Unverified</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      return <span className="text-slate-500 text-xs">{new Date(row.getValue("createdAt")).toLocaleDateString()}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      const handleBan = async () => {
        // Toggle Logic
        const newStatus = !user.isBanned;
        const res = await toggleUserBan(user.email, newStatus);
        if (res.success) {
          toast.success(`User has been ${newStatus ? 'banned' : 'unbanned'}.`);
        } else {
          toast.error(res.error);
        }
      };

      const handleDelete = async () => {
        if (!confirm("Are you sure? This action is irreversible.")) return;
        const res = await deleteUser(user._id);
        if (res.success) {
          toast.success("User deleted successfully.");
        } else {
          toast.error(res.error);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            {/* Communication Actions */}
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/chat?userId=${user._id}`} className="flex items-center gap-2 cursor-pointer">
                    <MessageSquare size={14} /> Chat with user
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 cursor-pointer">
                    <Mail size={14} /> Send Email
                </a>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Moderation Actions */}
            <DropdownMenuItem onClick={handleBan} className={user.isBanned ? "text-green-600" : "text-amber-600"}>
              <Ban size={14} className="mr-2" />
              {user.isBanned ? "Unban Account" : "Ban Account"}
            </DropdownMenuItem>

            {/* Delete (Only if NOT Verified) */}
            {!user.isVerified && (
               <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                 <Trash2 size={14} className="mr-2" />
                 Delete User
               </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]