"use client";

import dynamic from "next/dynamic";

const InterviewClient = dynamic(() => import("./InterviewClient"), {
    ssr: false,
});

export default function InterviewPage() {
    return <InterviewClient />;
}