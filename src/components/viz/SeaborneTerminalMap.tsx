"use client";

import dynamic from "next/dynamic";

const View = dynamic(() => import("./seaborne-map-view"), {
  ssr: false,
  loading: () => <div className="h-[520px] bg-ocean" />,
});

export default function SeaborneTerminalMap() {
  return (
    <div className="frame-ticks border border-border-hairline bg-ocean">
      <View />
    </div>
  );
}
