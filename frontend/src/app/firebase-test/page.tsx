"use client";

import { auth } from "@/firebase/firebase";

export default function FirebaseTest() {
    return (
        <div>
            <h1>Firebase Test</h1>

            <p>App Name: {auth.app.name}</p>

            <button
                onClick={() => {
                    console.log(auth.app.name);
                    alert(auth.app.name);
                }}
            >
                Test Firebase
            </button>
        </div>
    );
}