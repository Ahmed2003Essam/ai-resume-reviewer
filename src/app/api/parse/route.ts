import { NextRequest, NextResponse } from "next/server";
import { PdfReader } from "pdfreader";
import mammoth from "mammoth";

export const runtime = "nodejs";

function parsePdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        let text = "";

        new PdfReader().parseBuffer(buffer, (err, item) => {
            if (err) {
                reject(err);
            } else if (!item) {
                resolve(text);
            } else if (item.text) {
                text += item.text + " ";
            }
        });
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (file.name.toLowerCase().endsWith(".pdf")) {
            text = await parsePdf(buffer);
        } else if (file.name.toLowerCase().endsWith(".docx")) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            return NextResponse.json(
                { error: "Only PDF and DOCX files are supported." },
                { status: 400 }
            );
        }

        if (!text.trim()) {
            return NextResponse.json(
                { error: "No text found in this file." },
                { status: 400 }
            );
        }

        return NextResponse.json({ text });
    } catch (error) {
        console.error("PARSE ERROR:", error);
        return NextResponse.json({ error: "Parsing failed" }, { status: 500 });
    }
}