import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ⬇️ ubah buffer jadi stream
    const stream = Readable.from(buffer);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const upload = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GDRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: stream, // ✅ WAJIB stream
      },
      supportsAllDrives: true,
    });

    const fileId = upload.data.id;

    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const url = `https://drive.google.com/uc?id=${fileId}`;

    return NextResponse.json({ url });
  } catch (err: any) {
    console.log("UPLOAD DRIVE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
