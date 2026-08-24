import type { RefObject } from "react";

type ResumeUploaderProps = {
    fileName: string;
    isParsing: boolean;
    isDragging: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onDraggingChange: (isDragging: boolean) => void;
    onFile: (file: File) => void;
};

export default function ResumeUploader({
    fileName,
    isParsing,
    isDragging,
    fileInputRef,
    onDraggingChange,
    onFile,
}: ResumeUploaderProps) {
    return (
        <div>
            <label className="block font-medium text-gray-800">
                Upload Resume (PDF or DOCX)
            </label>

            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    onDraggingChange(true);
                }}
                onDragLeave={() => onDraggingChange(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    onDraggingChange(false);

                    const file = event.dataTransfer.files?.[0];
                    if (file) onFile(file);
                }}
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                    isDragging
                        ? "scale-[1.02] border-black bg-gray-100"
                        : "border-gray-300 bg-white hover:border-black hover:bg-gray-50"
                }`}
            >
                <label className="cursor-pointer">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onFile(file);
                        }}
                        className="hidden"
                    />

                    <div className="text-5xl">
                        {isParsing ? "⏳" : fileName ? "✅" : "📄"}
                    </div>

                    <p className="mt-3 font-semibold text-gray-900">
                        {isParsing
                            ? "Parsing resume..."
                            : fileName
                              ? "Resume uploaded"
                              : "Drag & drop your resume here"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        or click to browse PDF/DOCX
                    </p>

                    {fileName && (
                        <p className="mt-3 rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
                            {fileName}
                        </p>
                    )}
                </label>
            </div>
        </div>
    );
}
