import * as React from "react";

import { Shell } from "@/components/shell";
import { Homepage } from "./_views/homepage";

export default function IndexPage() {
  return (
    <Shell className="max-w-6xl">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 text-center py-12">
        <Homepage />
      </section>
    </Shell>
  );
}
