import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/server/errors';
import { authenticate, authorize } from '@/lib/server/auth';
import { SupplierBill } from '@/lib/server/models';
import { uploadToCloudinary } from '@/lib/server/cloudinary';
import { UserRole } from '@/lib/shared';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const formData = await req.formData();

  const file = formData.get('billFile') as File | null;
  if (!file) {
    return NextResponse.json(
      { success: false, message: 'Bill file is required.' },
      { status: 400 }
    );
  }

  const vendorName = formData.get('vendorName') as string;
  const billNumber = formData.get('billNumber') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const orderId = (formData.get('orderId') as string) || undefined;
  const indentNumber = (formData.get('indentNumber') as string) || undefined;

  // Upload file to Cloudinary
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = file.name.split('.').pop() || 'pdf';
  const publicId = `bill_${billNumber || Date.now()}`;

  const uploadResult = await uploadToCloudinary(
    buffer,
    'supplier-bills',
    publicId,
    ext === 'pdf' ? 'raw' : 'image'
  );

  const bill = await SupplierBill.create({
    vendorName,
    billNumber,
    amount,
    orderId,
    indentNumber,
    billFileUrl: uploadResult.url,
    uploadedBy: user.id,
  });

  return NextResponse.json(
    { success: true, message: 'Supplier bill uploaded.', data: bill },
    { status: 201 }
  );
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await authenticate(req);
  authorize(user, UserRole.ADMIN);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const [bills, total] = await Promise.all([
    SupplierBill.find()
      .populate('orderId', 'orderNumber')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SupplierBill.countDocuments(),
  ]);

  return NextResponse.json({
    success: true,
    data: bills,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
