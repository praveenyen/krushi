"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Link from "next/link";

// Defaults for form initialization
const DEFAULTS = {
  principal: 1200000,
  emi: 25600,
  tenureMonths: 60,
  emisRemaining: 28,
  monthlyInvestmentRatePct: 2,
};

const COLORS = ["#10b981", "#ef4444"]; // green for paid, red for remaining

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const SettlementPage = () => {
  // Form state

  // Editable loan summary fields
  const [principal, setPrincipal] = useState<number>(DEFAULTS.principal);
  const [emiAmount, setEmiAmount] = useState<number>(DEFAULTS.emi);
  const [tenureMonths, setTenureMonths] = useState<number>(DEFAULTS.tenureMonths);
  const [emisRemaining, setEmisRemaining] = useState<number>(DEFAULTS.emisRemaining);
  const [interestPct, setInterestPct] = useState<number>(DEFAULTS.monthlyInvestmentRatePct);

  // Derived values
  // Clamp EMIs remaining to tenure
  const clampedEmisRemaining = Math.max(0, Math.min(tenureMonths, emisRemaining));
  const emisPaid = Math.max(0, Math.min(tenureMonths, tenureMonths - clampedEmisRemaining));
  const amountPaid = Math.max(0, Math.round(emiAmount * emisPaid));
  const amountRemaining = Math.max(0, Math.round(emiAmount * clampedEmisRemaining));

  const i = (isFinite(interestPct) ? interestPct : 0) / 100; // monthly rate as decimal
  // Present value needed to fund an annuity of EMI for n months at rate i
  const lumpSumToday = (() => {
    const n = Math.max(0, Math.floor(isFinite(emisRemaining) ? emisRemaining : 0));
    if (n === 0) return 0;
    if (i <= 0) return Math.round(emiAmount * n);
    const pvFactor = (1 - Math.pow(1 + i, -n)) / i;
    return Math.max(0, Math.round(emiAmount * pvFactor));
  })();
  const projectedInterest = Math.max(0, amountRemaining - lumpSumToday);

  const pieData = [
    { name: "Amount Paid", value: amountPaid },
    { name: "Amount Remaining", value: amountRemaining },
  ];

  const barData = [
    {
      name: "Remaining EMIs",
      total: amountRemaining,
      "Lump Sum Principal": lumpSumToday,
      "Projected Interest Earned": projectedInterest,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900/20 dark:to-purple-900/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Loan Settlement Analysis
          </h1>
          <Link href="/loan" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Loan Tools
          </Link>
        </header>

        {/* Inputs */}
        <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Inputs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">EMIs Remaining</label>
                <input
                  type="number"
                  min={0}
                  max={tenureMonths}
                  value={emisRemaining}
                  onChange={(e) => setEmisRemaining(Math.max(0, Math.min(tenureMonths, Number(e.target.value))))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">Out of total {tenureMonths} months</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interest (% per month)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={interestPct}
                  onChange={(e) => setInterestPct(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">Monthly investment return assumption</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">EMI Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={emiAmount}
                  onChange={(e) => setEmiAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">Your current monthly EMI</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan Summary Card */}
          <section className="lg:col-span-1 bg-white/70 dark:bg-slate-900/60 backdrop-blur rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loan Summary</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Original loan details and current repayment progress</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Principal Loan Amount</div>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={principal}
                    onChange={e => setPrincipal(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Monthly EMI</div>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={emiAmount}
                    onChange={e => setEmiAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Tenure</div>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={tenureMonths}
                    onChange={e => setTenureMonths(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-500">months</span>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">EMIs Progress</div>
                  <div className="text-sm text-slate-900 dark:text-white">
                    <span className="font-semibold">{emisPaid}</span> paid ·
                    <span className="font-semibold"> {clampedEmisRemaining}</span> remaining
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Loan Repayment Progress</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => currency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Settlement Strategy Card */}
          <section className="lg:col-span-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Settlement Strategy
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  How can <span className="font-semibold">{currency(lumpSumToday)}</span> cover a remaining debt of
                  <span className="font-semibold"> {currency(amountRemaining)}</span>?
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  This is possible by investing the lump sum at a
                  <span className="font-semibold"> {interestPct}% monthly</span> interest rate.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Funding the Remaining EMIs</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => currency(Number(value))} />
                      <Legend />
                      <Bar dataKey="Lump Sum Principal" stackId="a" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Projected Interest Earned" stackId="a" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Total remaining = {currency(amountRemaining)} • Lump sum = {currency(lumpSumToday)} • Projected interest = {currency(projectedInterest)}
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  Assumption: The investment reliably yields {interestPct}% monthly returns over the next {emisRemaining} months. Real-world returns can vary; this is an illustrative model.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Key Takeaway */}
        <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Key Takeaway</h2>
            <p className="text-slate-700 dark:text-slate-300">
              By settling with a lump sum now, the total cash outflow is reduced by
              <span className="font-semibold"> {currency(projectedInterest)}</span> over the next {emisRemaining} months.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettlementPage;
