'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SearchBar from '@/components/ui/search-bar'
import FilterDropdown from '@/components/ui/filter-dropdown'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import EmptyState from '@/components/ui/empty-state'
import { MapPin, Users, Calendar, Globe, RefreshCw } from 'lucide-react'
import type { Club } from '@/types/database'

export default function ClubsPage() {
 const [clubs, setClubs] = useState<Club[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 
 // Search and filter states
 const [searchQuery, setSearchQuery] = useState('')
 const [selectedState, setSelectedState] = useState('')
 const [selectedDistrict, setSelectedDistrict] = useState('')
 const [selectedType, setSelectedType] = useState('')
 
 // Available filter options
 const [states, setStates] = useState<string[]>([])
 const [districts, setDistricts] = useState<string[]>([])
 const [clubTypes, setClubTypes] = useState<string[]>([])

 useEffect(() => {
 fetchClubs()
 }, [])

 useEffect(() => {
 // Extract unique values for filters
 const uniqueStates = [...new Set(clubs.filter(c => c.state).map(c => c.state!))]
 const uniqueDistricts = [...new Set(clubs.filter(c => c.district).map(c => c.district!))]
 const uniqueTypes = [...new Set(clubs.filter(c => c.club_type).map(c => c.club_type!))]
 
 setStates(uniqueStates.sort())
 setDistricts(uniqueDistricts.sort())
 setClubTypes(uniqueTypes.sort())
 }, [clubs])

 const fetchClubs = async () => {
 try {
 setLoading(true)
 setError(null)
 
 const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
 const client = createSupabaseClient()

 const { data, error: fetchError } = await client
 .from('clubs')
 .select('*')
 .eq('is_active', true)
 .order('created_at', { ascending: false })

 if (fetchError) {
 console.error('Error fetching clubs:', fetchError)
 setError('Failed to load clubs. Please try again.')
 } else {
 setClubs(data || [])
 }
 } catch (err) {
 console.error('Error:', err)
 setError('An error occurred while loading clubs. Please refresh and try again.')
 } finally {
 setLoading(false)
 }
 }

 // Filter clubs based on search and filters
 const filteredClubs = useMemo(() => {
 return clubs.filter(club => {
 const matchesSearch = !searchQuery || 
 club.club_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 club.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 club.description?.toLowerCase().includes(searchQuery.toLowerCase())
 
 const matchesState = !selectedState || club.state === selectedState
 const matchesDistrict = !selectedDistrict || club.district === selectedDistrict
 const matchesType = !selectedType || club.club_type === selectedType
 
 return matchesSearch && matchesState && matchesDistrict && matchesType
 })
 }, [clubs, searchQuery, selectedState, selectedDistrict, selectedType])

 const clearFilters = () => {
 setSearchQuery('')
 setSelectedState('')
 setSelectedDistrict('')
 setSelectedType('')
 }

 const hasActiveFilters = searchQuery || selectedState || selectedDistrict || selectedType

 return (
 <div className="min-h-screen bg-background">
 {/* Navigation */}
 <nav className="sticky-nav-mobile-safe bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-3">
 <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
 <h1 className="text-lg font-semibold text-foreground">
 Clubs Directory
 </h1>
 </div>
 <Button variant="outline" size="sm" asChild>
 <a href="/">← Back to Home</a>
 </Button>
 </div>
 </div>
 </nav>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Header */}
 <div className="mb-8">
 <h2 className="text-3xl font-bold text-foreground mb-2">
 Explore PCL Clubs
 </h2>
 <p className="text-muted-foreground">
 Discover and connect with {clubs.length} active clubs across the Professional Club League network
 </p>
 </div>

 {/* Demo Data Notice */}
 <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
 <p className="text-sm text-blue-900 text-center">
 <strong>Demo Data:</strong> All club profiles shown are sample data for demonstration purposes only.
 </p>
 </div>

 {/* Search and Filters */}
 <div className="mb-8 space-y-6">
 {/* Search Bar */}
 <div className="w-full">
 <SearchBar
 placeholder="Search clubs by name, city, or description..."
 value={searchQuery}
 onChange={setSearchQuery}
 onClear={() => setSearchQuery('')}
 className="max-w-2xl"
 />
 </div>

 {/* Filters */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <FilterDropdown
 label="State"
 value={selectedState}
 onChange={setSelectedState}
 options={states.map(state => ({ value: state, label: state }))}
 placeholder="Select state"
 />
 <FilterDropdown
 label="District"
 value={selectedDistrict}
 onChange={setSelectedDistrict}
 options={districts.map(district => ({ value: district, label: district }))}
 placeholder="Select district"
 />
 <FilterDropdown
 label="Club Type"
 value={selectedType}
 onChange={setSelectedType}
 options={clubTypes.map(type => ({ value: type, label: type.replace('_', ' ').toUpperCase() }))}
 placeholder="Select type"
 />
 <div className="flex items-end">
 {hasActiveFilters && (
 <Button
 variant="outline"
 onClick={clearFilters}
 className="w-full h-11"
 >
 <RefreshCw className="h-4 w-4 mr-2" />
 Clear Filters
 </Button>
 )}
 </div>
 </div>

 {/* Results Count */}
 <div className="flex items-center justify-between">
 <p className="text-sm text-muted-foreground">
 Showing {filteredClubs.length} of {clubs.length} clubs
 {hasActiveFilters && ' (filtered)'}
 </p>
 {error && (
 <Button
 variant="outline"
 size="sm"
 onClick={fetchClubs}
 className="gap-2"
 >
 <RefreshCw className="h-4 w-4" />
 Retry
 </Button>
 )}
 </div>
 </div>

 {/* Content */}
 {loading ? (
 <SkeletonLoader type="card" count={6} />
 ) : error ? (
 <EmptyState
 type="error"
 title="Failed to Load Clubs"
 description={error}
 action={{
 label: "Try Again",
 onClick: fetchClubs
 }}
 />
 ) : filteredClubs.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {filteredClubs.map((club) => (
 <Card key={club.id} className="card-hover overflow-hidden group">
 <CardHeader className="pb-3">
 {/* Club Logo */}
 <div className="flex items-center gap-3 mb-3">
 {club.logo_url ? (
 <img
 src={club.logo_url}
 alt={club.club_name}
 className="h-14 w-14 object-cover rounded-lg border bg-muted"
 onError={(e) => {
 (e.target as HTMLImageElement).style.display = 'none'
 }}
 />
 ) : (
 <div className="h-14 w-14 bg-muted rounded-lg flex items-center justify-center">
 <span className="text-muted-foreground font-semibold">
 {club.club_name?.charAt(0) || 'C'}
 </span>
 </div>
 )}
 <div className="flex-1 min-w-0">
 <CardTitle className="text-lg truncate">{club.club_name}</CardTitle>
 {club.city && club.state && (
 <CardDescription className="flex items-center gap-1">
 <MapPin className="h-3 w-3" />
 {club.city}, {club.state}
 </CardDescription>
 )}
 </div>
 </div>
 </CardHeader>

 <CardContent className="space-y-4 pb-6">
 {/* Description */}
 {club.description && (
 <p className="text-sm text-muted-foreground line-clamp-3">
 {club.description}
 </p>
 )}

 {/* Club Details */}
 <div className="space-y-2 text-sm">
 {club.club_type && (
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Type:</span>
 <span className="font-semibold text-foreground capitalize">
 {club.club_type.replace('_', ' ')}
 </span>
 </div>
 )}
 {club.category && (
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Category:</span>
 <span className="font-semibold text-foreground capitalize">
 {club.category}
 </span>
 </div>
 )}
 {club.founded_year && (
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Founded:</span>
 <span className="font-semibold text-foreground flex items-center gap-1">
 <Calendar className="h-3 w-3" />
 {club.founded_year}
 </span>
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="space-y-2 pt-2 border-t border-border">
 <Button
 size="sm"
 variant="outline"
 className="w-full group-hover:border-accent group-hover:text-accent transition-colors"
 asChild
 >
 <a href={`/club/${club.id}`}>
 <Users className="h-4 w-4 mr-2" />
 View Profile
 </a>
 </Button>
 {club.website && (
 <Button
 size="sm"
 variant="ghost"
 className="w-full text-muted-foreground hover:text-accent"
 asChild
 >
 <a href={club.website} target="_blank" rel="noopener noreferrer">
 <Globe className="h-4 w-4 mr-2" />
 Official Website
 </a>
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <EmptyState
 type="no-results"
 title={hasActiveFilters ? "No clubs match your criteria" : "No clubs found"}
 description={hasActiveFilters 
 ? "Try adjusting your search terms or filters to find what you're looking for."
 : "Check back soon as new clubs join the PCL network."
 }
 action={hasActiveFilters ? {
 label: "Clear Filters",
 onClick: clearFilters
 } : undefined}
 />
 )}
 </main>
 </div>
 )
}
