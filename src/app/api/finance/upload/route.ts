import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateUploadRequest, FINANCE_UPLOAD_POLICY, handleUploadError } from '@/lib/security/upload-security';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;

    if (!session || (role !== 'Finance Admin' && role !== 'Super Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.formData();
    
    // Validate
    const validation = await validateUploadRequest(data, 'file', FINANCE_UPLOAD_POLICY);
    if (!validation.isValid || !validation.files || validation.files.length === 0) {
      return handleUploadError(validation);
    }
    
    const file = validation.files[0];

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // In a real app this would go to S3 or a private storage bucket.
    // For this pilot, we save it locally in a private directory.
    const filename = `finance_proof_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const filepath = path.join(process.cwd(), 'private_uploads', 'finance', filename);
    
    // Ensure directory exists
    await mkdir(path.dirname(filepath), { recursive: true });
    
    await writeFile(filepath, buffer);

    return NextResponse.json({ success: true, filepath });
  } catch (error) {
    console.error('Finance upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
