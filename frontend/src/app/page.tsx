"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LandingPage } from "@/components/LandingPage";
import { TradePage } from "@/components/TradePage";
import { DashboardPage } from "@/components/DashboardPage";

export default function Home() {
  const [page, setPage] = useState("markets");

  return (
    <>
      <Navbar page={page} setPage={setPage} />
      {page === "markets" && <LandingPage setPage={setPage} />}
      {page === "trade" && <TradePage />}
      {page === "dashboard" && <DashboardPage />}
    </>
  );
}
