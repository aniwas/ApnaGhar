import React, { useState, useEffect } from 'react';
import { Calculator, Sparkles, DollarSign, Percent, Calendar, Heart, ShieldQuestion } from 'lucide-react';

interface MortgageCalculatorProps {
  propertyPrice: number;
  currency?: string;
}

export default function MortgageCalculator({ propertyPrice, currency = 'INR' }: MortgageCalculatorProps) {
  // State variables for calculations
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState(20);
  const [calculatedEMI, setCalculatedEMI] = useState(0);

  // Eligibility inputs
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [otherMonthlyDues, setOtherMonthlyDues] = useState(15000);

  // Compute EMI when parameters change
  useEffect(() => {
    const loanAmount = propertyPrice * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = loanTenureYears * 12;

    if (interestRate === 0) {
      setCalculatedEMI(loanAmount / totalMonths);
    } else {
      const emi = 
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      setCalculatedEMI(Math.round(emi));
    }
  }, [propertyPrice, downPaymentPercent, interestRate, loanTenureYears]);

  const formatPrice = (val: number) => {
    return currency === 'INR' 
      ? `₹${val.toLocaleString('en-IN')}`
      : val.toLocaleString('en-US', {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: 0,
        });
  };

  const reqLoan = propertyPrice * (1 - downPaymentPercent / 100);
  const mRate = (interestRate / 12) / 100;
  const totalM = loanTenureYears * 12;
  const availEMIForLoan = Math.max(0, (monthlyIncome * 0.5) - otherMonthlyDues);
  
  let maxEligibilityValue = 0;
  if (mRate > 0) {
    maxEligibilityValue = (availEMIForLoan * (1 - Math.pow(1 + mRate, -totalM))) / mRate;
  } else {
    maxEligibilityValue = availEMIForLoan * totalM;
  }
  maxEligibilityValue = Math.round(maxEligibilityValue);
  const elStatus = maxEligibilityValue >= reqLoan;

  const totalPayment = (calculatedEMI * totalM) + (propertyPrice * downPaymentPercent / 100);
  const totalInterest = Math.max(0, totalPayment - propertyPrice);

  return (
    <div className="backdrop-blur-md bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="p-2 bg-blue-500/15 text-blue-400 rounded-xl">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Smart Housing Finance Planner</h4>
          <p className="text-[10px] text-white/50 leading-none mt-0.5">Custom EMI amortization & monthly feasibility calculator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Downpayment Selector */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40 font-bold uppercase">
            <span>Down Payment</span>
            <span className="text-blue-400">{downPaymentPercent}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-black font-mono text-white block mt-0.5">
            {formatPrice((propertyPrice * downPaymentPercent) / 100)}
          </span>
        </div>

        {/* Interest Rate Selector */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40 font-bold uppercase">
            <span>Interest Rate</span>
            <span className="text-blue-400">{interestRate}%</span>
          </div>
          <input
            type="range"
            min="4"
            max="18"
            step="0.25"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-black font-mono text-white block mt-0.5">
            {interestRate}% per annum
          </span>
        </div>

        {/* Loan Tenure Selector */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40 font-bold uppercase">
            <span>Loan Tenure</span>
            <span className="text-blue-400">{loanTenureYears} Yrs</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={loanTenureYears}
            onChange={(e) => setLoanTenureYears(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-black font-mono text-white block mt-0.5">
            {loanTenureYears} Years amortization
          </span>
        </div>
      </div>

      {/* EMI calculation result box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/5 border border-white/5 rounded-xl">
        <div className="flex flex-col justify-center sm:col-span-1">
          <span className="text-[10px] font-mono font-bold uppercase text-white/40 tracking-wider">Estimated Monthly EMI</span>
          <p className="text-[10px] text-white/40 leading-snug">Calculated on remaining principal loan value of {formatPrice(reqLoan)}</p>
        </div>
        <div className="sm:col-span-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 py-2 sm:py-0">
          <span className="text-2xl font-black text-blue-400 leading-none">{formatPrice(calculatedEMI)}</span>
          <span className="text-[10px] text-white/50 font-mono mt-0.5">/ month</span>
        </div>
        <div className="sm:col-span-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 py-2 sm:py-0">
          <span className="text-sm font-bold text-slate-300 leading-none">{formatPrice(totalInterest)}</span>
          <span className="text-[10px] text-white/40 font-mono mt-0.5">Total Interest Owed</span>
        </div>
      </div>

      {/* Dynamic Loan Eligibility segment */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-white">Income Feasibility Guard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/45 uppercase font-mono block">Your Take-home Monthly Income</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-white/40">₹</span>
              <input 
                type="number"
                min="0"
                step="5000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-6 pr-3 py-1.5 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/45 uppercase font-mono block">Other Active Monthly Debts</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-white/40">₹</span>
              <input 
                type="number"
                min="0"
                step="1000"
                value={otherMonthlyDues}
                onChange={(e) => setOtherMonthlyDues(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-6 pr-3 py-1.5 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Feasibility Alert Banner */}
        <div className={`p-3.5 rounded-xl border ${elStatus ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'} text-[11px] text-slate-300 leading-relaxed font-sans`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white/90">Affordable Loan Target:</span>
            <span className="font-mono text-white">{formatPrice(maxEligibilityValue)} max loan</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            {elStatus ? (
              <>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animation-pulse shrink-0" />
                <span className="text-emerald-400 font-bold">
                  Qualified to Lease or Buy! Secure home financing comfortably below the 50% debt-to-income threshold.
                </span>
              </>
            ) : (
              <>
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animation-pulse shrink-0" />
                <span className="text-amber-400 font-bold">
                  Ineligible on current tier. We recommend increasing your down payment to {(downPaymentPercent + 10)}% or extending loan tenure.
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
