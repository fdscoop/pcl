import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const club_id = formData.get('club_id') as string
    const documents = formData.getAll('documents') as File[]

    if (!club_id || documents.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify club ownership and get club details
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('id, club_type, registration_number')
      .eq('id', club_id)
      .eq('owner_id', user.id)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: 'Club not found or unauthorized' },
        { status: 403 }
      )
    }

    const isRegistered = clubData.club_type === 'Registered' && clubData.registration_number

    // Upload documents to Supabase Storage
    const uploadedDocuments = []

    for (const file of documents) {
      const fileName = `${club_id}/${Date.now()}_${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError, data } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: `Failed to upload ${file.name}` },
          { status: 500 }
        )
      }

      uploadedDocuments.push({
        file_name: file.name,
        file_path: data.path,
        upload_time: new Date().toISOString()
      })
    }

    // Update club's KYC verification status
    const updateData = isRegistered 
      ? {
          kyc_verified: false, // Still pending admin review
          document_verification_status: 'pending_review'
        }
      : {
          kyc_verified: true,
          document_verification_status: 'documents_verified'
        }

    const { error: updateError } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', club_id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      )
    }

    // Store document metadata in database
    const { error: dbError } = await supabase
      .from('kyc_documents')
      .update({
        documents_uploaded: true,
        document_status: isRegistered ? 'pending_admin_review' : 'documents_verified',
        documents_upload_date: new Date().toISOString()
      })
      .eq('club_id', club_id)

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request if metadata storage fails
    }

    return NextResponse.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents_count: uploadedDocuments.length,
      status: isRegistered ? 'pending_admin_review' : 'verified'
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
