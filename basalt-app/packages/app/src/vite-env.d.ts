/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BASALT_PLATFORM?: "memory";
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
