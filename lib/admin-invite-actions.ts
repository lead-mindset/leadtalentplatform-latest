
'use server'

import { createClient } from './supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function createRecruiterInvite(formData: {
  recruiterEmail: string;
  companyId: string;
  expiresInDays?: number;
}) {
  const supabase = await createClient();
  
  console.log('=== INVITE DEBUG START ===');
  console.log('1. Form data:', formData);
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  console.log('2. Auth user:', authUser?.id, authUser?.email);
  
  if (!authUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: adminUser, error: adminCheckError } = await supabase
    .from('User')
    .select('id, email, role')
    .eq('id', authUser.id)
    .single();

  console.log('3. Admin user check:', adminUser);

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized - not an admin' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.recruiterEmail)) {
    return { success: false, error: 'Invalid email address' };
  }

  const { data: company } = await supabase
    .from('Company')
    .select('id, name')
    .eq('id', formData.companyId)
    .single();

  console.log('4. Company check:', company);

  if (!company) {
    return { success: false, error: 'Company not found' };
  }

  let recruiterId: string | null = null;
  const { data: existingUser } = await supabase
    .from('User')
    .select('id, role')
    .eq('email', formData.recruiterEmail)
    .maybeSingle();

  console.log('5. Existing user check:', existingUser);

  if (existingUser) {
    if (existingUser.role !== 'recruiter') {
      return { 
        success: false, 
        error: 'A user with this email exists but is not a recruiter' 
      };
    }
    recruiterId = existingUser.id;

    const { data: existingInvite } = await supabase
      .from('RecruiterAccess')
      .select('id, acceptedAt, revokedAt')
      .eq('recruiterId', recruiterId)
      .eq('companyId', formData.companyId)
      .maybeSingle();

    if (existingInvite && !existingInvite.revokedAt) {
      if (existingInvite.acceptedAt) {
        return { 
          success: false, 
          error: 'This recruiter already has access to this company' 
        };
      }
      return { 
        success: false, 
        error: 'A pending invitation already exists for this recruiter' 
      };
    }
  } else {
    console.log('8. Creating new recruiter user with SERVICE ROLE...');
    
    const serviceClient = getServiceClient();
    
    const { data: uuidData } = await serviceClient.rpc('gen_random_uuid');
    const newUserId = uuidData || crypto.randomUUID();
    const now = new Date().toISOString();
    
    console.log('8a. Generated user ID:', newUserId);
    
    const { data: newUser, error: userError } = await serviceClient
      .from('User')
      .insert({
        id: newUserId,
        email: formData.recruiterEmail,
        name: formData.recruiterEmail.split('@')[0],
        role: 'recruiter',
        chapterId: null,
        createdAt: now,
        updatedAt: now,
      })
      .select('id')
      .single();

    console.log('9. New user result:', newUser);
    console.log('9. New user error:', userError);
    
    if (userError) {
      console.error('USER CREATION FAILED:', JSON.stringify(userError, null, 2));
      return { 
        success: false, 
        error: `Failed to create recruiter account: ${userError.message}` 
      };
    }
    
    if (!newUser) {
      return { success: false, error: 'Failed to create recruiter account - no data returned' };
    }

    recruiterId = newUser.id;
    console.log('10. New recruiter ID:', recruiterId);
  }

  const expiresAt = formData.expiresInDays
    ? new Date(Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  console.log('11. Creating invite for recruiter:', recruiterId);

  const { data: invite, error: inviteError } = await supabase
    .from('RecruiterAccess')
    .insert({
      recruiterId,
      recruiterEmail: formData.recruiterEmail,
      companyId: formData.companyId,
      grantedById: authUser.id,
      grantedAt: new Date().toISOString(),
      inviteExpiresAt: expiresAt.toISOString(),
      isActive: false,
    })
    .select('id')
    .single();

  console.log('12. Invite result:', invite);
  console.log('12. Invite error:', inviteError);

  if (inviteError || !invite) {
    console.error('Failed to create invite:', inviteError);
    return { success: false, error: 'Failed to create invitation' };
  }

  revalidatePath('/admin/invites');
  revalidatePath('/admin/companies');

  console.log('=== INVITE DEBUG END - SUCCESS ===');
  return { 
    success: true, 
    inviteId: invite.id,
    message: `Invitation sent to ${formData.recruiterEmail}` 
  };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select('id, acceptedAt, revokedAt')
    .eq('id', inviteId)
    .single();

  if (!invite) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'Cannot revoke an accepted invitation' };
  }

  if (invite.revokedAt) {
    return { success: false, error: 'Invitation already revoked' };
  }

  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      revokedAt: new Date().toISOString(),
      revokedById: authUser.id,
      isActive: false,
    })
    .eq('id', inviteId);

  if (error) {
    console.error('Failed to revoke invite:', error);
    return { success: false, error: 'Failed to revoke invitation' };
  }

  revalidatePath('/admin/invites');
  
  return { success: true, message: 'Invitation revoked successfully' };
}

export async function resendInvite(inviteId: string) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: adminUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      recruiterEmail,
      acceptedAt,
      revokedAt,
      Company (name)
    `)
    .eq('id', inviteId)
    .single();

  if (!invite) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'Cannot resend an accepted invitation' };
  }

  if (invite.revokedAt) {
    return { success: false, error: 'Cannot resend a revoked invitation' };
  }

  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      inviteExpiresAt: newExpiresAt.toISOString(),
    })
    .eq('id', inviteId);

  if (error) {
    console.error('Failed to update invite:', error);
    return { success: false, error: 'Failed to resend invitation' };
  }

  revalidatePath('/admin/invites');
  
  return { success: true, message: 'Invitation resent successfully' };
}