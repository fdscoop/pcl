'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
 Users,
 Search,
 Shield,
 User,
 Mail,
 Phone,
 Calendar,
 CheckCircle,
 XCircle
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface UserData {
 id: string
 email: string
 phone: string | null
 first_name: string
 last_name: string
 role: string
 kyc_status: string
 is_active: boolean
 aadhaar_verified: boolean
 created_at: string
 last_login: string | null
}

export default function UserManagement() {
 const [users, setUsers] = useState<UserData[]>([])
 const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
 const [loading, setLoading] = useState(true)
 const [searchQuery, setSearchQuery] = useState('')
 const [roleFilter, setRoleFilter] = useState<string>('all')
 const { addToast } = useToast()
 const supabase = createClient()

 useEffect(() => {
 loadUsers()
 }, [])

 useEffect(() => {
 filterUsers()
 }, [searchQuery, roleFilter, users])

 const loadUsers = async () => {
 try {
 setLoading(true)

 const { data, error } = await supabase
 .from('users')
 .select('*')
 .order('created_at', { ascending: false })

 if (error) throw error

 setUsers(data || [])
 } catch (error) {
 console.error('Error loading users:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load users',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 const filterUsers = () => {
 let filtered = users

 // Apply role filter
 if (roleFilter !== 'all') {
 filtered = filtered.filter(user => user.role === roleFilter)
 }

 // Apply search query
 if (searchQuery.trim()) {
 const query = searchQuery.toLowerCase()
 filtered = filtered.filter(user =>
 user.email.toLowerCase().includes(query) ||
 user.first_name.toLowerCase().includes(query) ||
 user.last_name.toLowerCase().includes(query) ||
 (user.phone && user.phone.includes(query))
 )
 }

 setFilteredUsers(filtered)
 }

 const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
 try {
 const { error } = await supabase
 .from('users')
 .update({ is_active: !currentStatus })
 .eq('id', userId)

 if (error) throw error

 addToast({
 title: 'Success',
 description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
 type: 'success'
 })

 await loadUsers()
 } catch (error) {
 console.error('Error updating user status:', error)
 addToast({
 title: 'Error',
 description: 'Failed to update user status',
 type: 'error'
 })
 }
 }

 const getRoleBadgeColor = (role: string) => {
 const colors: Record<string, string> = {
 admin: 'bg-purple-600',
 player: 'bg-blue-600',
 club_owner: 'bg-green-600',
 stadium_owner: 'bg-orange-600',
 referee: 'bg-yellow-600',
 staff: 'bg-pink-600'
 }
 return colors[role] || 'bg-gray-600'
 }

 const getRoleLabel = (role: string) => {
 const labels: Record<string, string> = {
 player: 'Player',
 club_owner: 'Club Owner',
 stadium_owner: 'Stadium Owner',
 referee: 'Referee',
 staff: 'Staff',
 admin: 'Admin'
 }
 return labels[role] || role
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
 <p className="text-muted-foreground">
 Manage platform users and their access
 </p>
 </div>

 {/* Filters */}
 <Card className="border-2 shadow-lg">
 <CardHeader>
 <CardTitle className="text-lg flex items-center gap-2">
 <Search className="w-5 h-5" />
 Search & Filter
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Search Users</label>
 <Input
 placeholder="Search by name, email, or phone..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Filter by Role</label>
 <select
 value={roleFilter}
 onChange={(e) => setRoleFilter(e.target.value)}
 className="w-full px-3 py-2 border border-input rounded-md bg-background"
 >
 <option value="all">All Roles</option>
 <option value="player">Players</option>
 <option value="club_owner">Club Owners</option>
 <option value="stadium_owner">Stadium Owners</option>
 <option value="referee">Referees</option>
 <option value="staff">Staff</option>
 <option value="admin">Admins</option>
 </select>
 </div>
 </div>
 <div className="flex items-center gap-4 text-sm">
 <span className="text-muted-foreground">Total Users:</span>
 <Badge variant="outline" className="font-semibold">{filteredUsers.length}</Badge>
 </div>
 </CardContent>
 </Card>

 {/* Users List */}
 <div className="grid grid-cols-1 gap-4">
 {filteredUsers.length === 0 ? (
 <Card className="border-2 border-dashed">
 <CardContent className="flex flex-col items-center justify-center py-12">
 <Users className="w-12 h-12 text-muted-foreground mb-4" />
 <p className="text-muted-foreground text-center">
 No users found matching your criteria
 </p>
 </CardContent>
 </Card>
 ) : (
 filteredUsers.map((user) => (
 <Card key={user.id} className="border-2 hover:shadow-lg transition-shadow">
 <CardContent className="pt-6">
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4 flex-1">
 <div className={`p-3 rounded-xl bg-gradient-to-br ${getRoleBadgeColor(user.role)}`}>
 <User className="w-6 h-6 text-white" />
 </div>
 <div className="flex-1 space-y-3">
 <div>
 <h3 className="font-bold text-lg">
 {user.first_name} {user.last_name}
 </h3>
 <div className="flex items-center gap-2 mt-1">
 <Badge className={getRoleBadgeColor(user.role)}>
 {getRoleLabel(user.role)}
 </Badge>
 {user.is_active ? (
 <Badge variant="default" className="bg-green-600 gap-1">
 <CheckCircle className="w-3 h-3" />
 Active
 </Badge>
 ) : (
 <Badge variant="secondary" className="gap-1">
 <XCircle className="w-3 h-3" />
 Inactive
 </Badge>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
 <div className="flex items-center gap-2">
 <Mail className="w-4 h-4 text-muted-foreground" />
 <span className="text-muted-foreground truncate">{user.email}</span>
 </div>
 {user.phone && (
 <div className="flex items-center gap-2">
 <Phone className="w-4 h-4 text-muted-foreground" />
 <span className="text-muted-foreground">{user.phone}</span>
 </div>
 )}
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4 text-muted-foreground" />
 <span className="text-muted-foreground">
 Joined {new Date(user.created_at).toLocaleDateString()}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-4 text-xs">
 <div className="flex items-center gap-1">
 <Shield className="w-3 h-3 text-muted-foreground" />
 <span className="text-muted-foreground">KYC:</span>
 <Badge 
 variant={user.kyc_status === 'verified' ? 'default' : 'secondary'}
 className={`text-xs ${user.kyc_status === 'verified' ? 'bg-green-600' : ''}`}
 >
 {user.kyc_status}
 </Badge>
 </div>
 <div className="flex items-center gap-1">
 <span className="text-muted-foreground">Aadhaar:</span>
 {user.aadhaar_verified ? (
 <CheckCircle className="w-4 h-4 text-green-600" />
 ) : (
 <XCircle className="w-4 h-4 text-slate-400" />
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-2">
 <Button
 variant={user.is_active ? 'destructive' : 'default'}
 size="sm"
 onClick={() => toggleUserStatus(user.id, user.is_active)}
 className="whitespace-nowrap"
 >
 {user.is_active ? 'Deactivate' : 'Activate'}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </div>
 </div>
 )
}
