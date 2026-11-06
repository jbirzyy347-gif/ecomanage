"use client";
import dynamic from "next/dynamic";
const Map = dynamic(() => import("./map"), { ssr: false, loading: () => <p className="p-6 text-gray-500">Memuat peta…</p> });
export default Map;
