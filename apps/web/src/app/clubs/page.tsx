'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SearchBar from '@/components/ui/search-bar'
import FilterDropdown from '@/components/ui/filter-dropdown'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import EmptyState from '@/components/ui/empty-state'
import { MapPin, Users, Calendar, Globe, RefreshCw, Trophy, CheckCircle, Clock, ArrowLeft } from 'lucide-react'
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
                        <Button variant="outline" size="sm" asChild className="btn-lift">
                            <a href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Home</a>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                        Explore PCL Clubs
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Discover and connect with {clubs.length} active clubs across the Professional Club League network
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="glass-card rounded-xl p-6 mb-8 space-y-6">
                    {/* Search Bar */}
                    <div className="w-full">
                        <SearchBar
                            placeholder="Search clubs by name, city, or description..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            className="max-w-2xl mx-auto"
                        />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FilterDropdown
                            label="State"
                            value={selectedState}
                            onChange={setSelectedState}
                            options={states.map(state => ({ value: state, label: state }))}
                            placeholder="All States"
                        />
                        <FilterDropdown
                            label="District"
                            value={selectedDistrict}
                            onChange={setSelectedDistrict}
                            options={districts.map(district => ({ value: district, label: district }))}
                            placeholder="All Districts"
                        />
                        <FilterDropdown
                            label="Club Type"
                            value={selectedType}
                            onChange={setSelectedType}
                            options={clubTypes.map(type => ({ value: type, label: type.replace('_', ' ').toUpperCase() }))}
                            placeholder="All Types"
                        />
                        <div className="flex items-end">
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="w-full h-11 btn-lift"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filteredClubs.length}</span> of {clubs.length} clubs
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="glass-card overflow-hidden">
                                <div className="h-24 bg-gradient-to-r from-primary/30 to-accent/20" />
                                <CardContent className="p-5 pt-8">
                                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                                    <div className="h-20 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClubs.map((club) => (
                            <Card key={club.id} className="glass-card stat-card-enhanced overflow-hidden group">
                                {/* Banner */}
                                <div className="h-24 bg-gradient-to-r from-primary/60 to-accent/40 relative">
                                    {club.banner_url && (
                                        <img
                                            src={club.banner_url}
                                            alt=""
                                            className="w-full h-full object-cover absolute inset-0"
                                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                        />
                                    )}
                                    {/* Registration Badge - checks multiple verification fields */}
                                    <div className="absolute top-3 right-3">
                                        {(club.registration_status === 'registered' ||
                                            (club as any).is_verified === true ||
                                            (club as any).kyc_status === 'verified' ||
                                            (club as any).kyc_status === 'approved') ? (
                                            <div className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                <CheckCircle size={12} />
                                                Verified
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                <Clock size={12} />
                                                Pending
                                            </div>
                                        )}
                                    </div>
                                    {/* Logo */}
                                    <div className="absolute -bottom-6 left-4">
                                        {club.logo_url ? (
                                            <img
                                                src={club.logo_url}
                                                alt={club.club_name}
                                                className="h-14 w-14 object-cover rounded-xl border-4 border-white shadow-lg bg-white"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="h-14 w-14 rounded-xl border-4 border-white shadow-lg bg-primary/20 flex items-center justify-center">
                                                <Trophy className="h-6 w-6 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <CardHeader className="pt-8 pb-2">
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                                        {club.club_name}
                                    </CardTitle>
                                    {club.city && club.state && (
                                        <CardDescription className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {club.city}, {club.state}
                                        </CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-4 pb-5">
                                    {/* Stats Row */}
                                    <div className="flex items-center gap-4 text-sm">
                                        {club.total_members !== undefined && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Users size={14} className="text-primary" />
                                                <span className="font-semibold text-foreground">{club.total_members}</span>
                                                <span>Members</span>
                                            </div>
                                        )}
                                        {club.founded_year && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar size={14} className="text-primary" />
                                                <span className="font-semibold text-foreground">{club.founded_year}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {club.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {club.description}
                                        </p>
                                    )}

                                    {/* Category Badge */}
                                    {club.category && (
                                        <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                                            {club.category}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-3 border-t border-border/50">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full btn-lift group-hover:bg-primary group-hover:text-white transition-all"
                                            asChild
                                        >
                                            <a href={`/club/${club.id}`}>
                                                View Club Profile
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="glass-card max-w-lg mx-auto p-8 rounded-2xl">
                            <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {hasActiveFilters ? "No clubs match your criteria" : "No clubs found"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {hasActiveFilters
                                    ? "Try adjusting your search terms or filters."
                                    : "Check back soon as new clubs join the PCL network."
                                }
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters} className="btn-lift">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

