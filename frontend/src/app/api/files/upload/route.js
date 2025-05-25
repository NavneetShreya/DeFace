import dbConnect from '@/lib/db';
import File from '@/models/File';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false, // required for streaming file uploads
  },
};

export async function POST(request) {
  await dbConnect();

  try {
    // --- 1. Extract & verify JWT from cookie ---
    const cookieHeader = request.headers.get('cookie') || '';
    const token = cookieHeader
      .split('; ')
      .find((c) => c.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // --- 2. Parse the incoming multipart/form-data ---
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file into a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- 3. Re-package using server-side FormData & send to FastAPI ---
    const upstream = new FormData();
    upstream.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    const apiRes = await axios.post('http://localhost:8000/predict/', upstream, {
      headers: upstream.getHeaders(),
    });

    const { prediction, class_probabilities } = apiRes.data;

    // --- 4. Save metadata in MongoDB ---
    const newFile = await File.create({
      filename: file.name,
      path: `/uploads/${file.name}`,  // adjust if you’re actually saving to disk/S3/etc
      size: file.size,
      mimetype: file.type,
      user: decoded.id,
    });

    // --- 5. Return combined response ---
    return NextResponse.json(
      {
        success: true,
        file: {
          id: newFile._id,
          filename: newFile.filename,
          size: newFile.size,
          uploadedAt: newFile.uploadedAt,
        },
        prediction,
        classifications: class_probabilities,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: 'Error processing request' },
      { status: 500 }
    );
  }
}
