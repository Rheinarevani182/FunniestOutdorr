import { defineConfig } from "vite";
export default defineConfig({server:{proxy:{"/api":"http://127.0.0.1:5173"},port:5174},build:{outDir:"dist/client"}});
