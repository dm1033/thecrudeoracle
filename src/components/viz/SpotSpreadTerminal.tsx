"use client";

import dynamic from "next/dynamic";
import type { SpotSpreadPayload } from "./spot-spread-view";

const View = dynamic(() => import("./spot-spread-view"), {
  ssr: false,
  loading: () => <div className="h-[460px] bg-surface-1" />,
});

export default function SpotSpreadTerminal({ data, showHenry = true }: { data: SpotSpreadPayload | null; showHenry?: boolean }) {
  return <View data={data} showHenry={showHenry} />;
}
