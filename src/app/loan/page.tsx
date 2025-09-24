'use client'

import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Import the calculateCompoundInterest function
function calculateCompoundInterest(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    compoundingInterval: number
) {
    if (
        typeof principal !== 'number' ||
        typeof monthlyRate !== 'number' ||
        typeof totalMonths !== 'number' ||
        typeof compoundingInterval !== 'number'
    ) {
        throw new Error('Invalid input. All parameters must be valid numbers.');
    }

    let currentPrincipal = principal;
    const rateAsDecimal = monthlyRate / 100;
    const breakdown = [];

    const numFullPeriods = Math.floor(totalMonths / compoundingInterval);
    const remainingMonths = totalMonths % compoundingInterval;

    for (let i = 0; i < numFullPeriods; i++) {
        const startingPrincipalForPeriod = currentPrincipal;
        const interestForPeriod = startingPrincipalForPeriod * rateAsDecimal * compoundingInterval;
        const endingPrincipalForPeriod = startingPrincipalForPeriod + interestForPeriod;

        const startMonth = i * compoundingInterval + 1;
        const endMonth = (i + 1) * compoundingInterval;

        breakdown.push({
            period: i + 1,
            label: `Months ${startMonth} to ${endMonth}`,
            startingPrincipal: parseFloat(startingPrincipalForPeriod.toFixed(2)),
            interestEarned: parseFloat(interestForPeriod.toFixed(2)),
            endingPrincipal: parseFloat(endingPrincipalForPeriod.toFixed(2)),
        });

        currentPrincipal = endingPrincipalForPeriod;
    }

    if (remainingMonths > 0) {
        const startingPrincipalForPeriod = currentPrincipal;
        const interestForRemaining = startingPrincipalForPeriod * rateAsDecimal * remainingMonths;
        const endingPrincipalForPeriod = startingPrincipalForPeriod + interestForRemaining;

        const startMonth = numFullPeriods * compoundingInterval + 1;
        const endMonth = totalMonths;

        breakdown.push({
            period: numFullPeriods + 1,
            label: `Remaining ${remainingMonths} Months (${startMonth} to ${endMonth})`,
            startingPrincipal: parseFloat(startingPrincipalForPeriod.toFixed(2)),
            interestEarned: parseFloat(interestForRemaining.toFixed(2)),
            endingPrincipal: parseFloat(endingPrincipalForPeriod.toFixed(2)),
        });

        currentPrincipal = endingPrincipalForPeriod;
    }

    return {
        inputs: {
            principal,
            monthlyRate,
            totalMonths,
            compoundingInterval,
        },
        totalAmount: parseFloat(currentPrincipal.toFixed(2)),
        breakdown: breakdown,
    };
}

const FinancialActivitiesPage = () => {
    const [formData, setFormData] = useState({
        principalAmount: '',
        interestRate: '',
        months: '',
        interval: ''
    })

    const [result, setResult] = useState(null)
    const [isCalculating, setIsCalculating] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleCalculate = (e) => {
        e.preventDefault()
        setIsCalculating(true)

        try {
            const principal = parseFloat(formData.principalAmount)
            const rate = parseFloat(formData.interestRate)
            const months = parseInt(formData.months)
            const interval = parseInt(formData.interval)

            if (isNaN(principal) || isNaN(rate) || isNaN(months) || isNaN(interval)) {
                alert('Please enter valid numbers for all fields')
                return
            }

            if (principal <= 0 || rate <= 0 || months <= 0 || interval <= 0) {
                alert('All values must be positive numbers')
                return
            }

            const calculationResult = calculateCompoundInterest(principal, rate, months, interval)
            setResult(calculationResult)
        } catch (error) {
            alert('Error in calculation: ' + error.message)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleReset = () => {
        setFormData({
            principalAmount: '',
            interestRate: '',
            months: '',
            interval: ''
        })
        setResult(null)
    }

    // Prepare chart data
    const chartData = result?.breakdown.map((item, index) => ({
        period: `Period ${item.period}`,
        principal: item.startingPrincipal,
        interest: item.interestEarned,
        total: item.endingPrincipal,
        cumulativeInterest: result.breakdown.slice(0, index + 1).reduce((sum, b) => sum + b.interestEarned, 0)
    })) || []

    // Pie chart data for final breakdown
    const pieData = result ? [
        { name: 'Principal', value: result.inputs.principal, color: '#3b82f6' },
        { name: 'Interest Earned', value: result.totalAmount - result.inputs.principal, color: '#10b981' }
    ] : []

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Financial Activities Calculator</h1>
                    <p className="text-gray-600">Calculate compound interest with detailed breakdown and visualizations</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Loan Parameters</h2>

                            <form onSubmit={handleCalculate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Principal Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="principalAmount"
                                        value={formData.principalAmount}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter principal amount"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Interest Rate (% per month)
                                    </label>
                                    <input
                                        type="number"
                                        name="interestRate"
                                        value={formData.interestRate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter monthly interest rate"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Total Months
                                    </label>
                                    <input
                                        type="number"
                                        name="months"
                                        value={formData.months}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter total months"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Compounding Interval (months)
                                    </label>
                                    <input
                                        type="number"
                                        name="interval"
                                        value={formData.interval}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter compounding interval"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isCalculating}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isCalculating ? 'Calculating...' : 'Calculate'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                        {result ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold text-gray-700">Initial Principal</h3>
                                            <p className="text-3xl font-bold text-blue-600">
                                                ₹{result.inputs.principal.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold text-gray-700">Total Interest</h3>
                                            <p className="text-3xl font-bold text-green-600">
                                                ₹{(result.totalAmount - result.inputs.principal).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold text-gray-700">Final Amount</h3>
                                            <p className="text-3xl font-bold text-purple-600">
                                                ₹{result.totalAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {/* Line Chart */}
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Growth Over Time</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="period" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                                <Legend />
                                                <Line type="monotone" dataKey="principal" stroke="#3b82f6" strokeWidth={2} name="Principal" />
                                                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total Amount" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Pie Chart */}
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Final Breakdown</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Interest Earned by Period</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                            <Legend />
                                            <Bar dataKey="interest" fill="#10b981" name="Interest Earned" />
                                            <Bar dataKey="cumulativeInterest" fill="#f59e0b" name="Cumulative Interest" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Detailed Breakdown Table */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Breakdown</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Period</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Duration</th>
                                                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Starting Principal</th>
                                                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Interest Earned</th>
                                                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Ending Principal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.breakdown.map((period, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{period.period}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{period.label}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                            ₹{period.startingPrincipal.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-green-600 text-right font-medium">
                                                            ₹{period.interestEarned.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 text-right font-semibold">
                                                            ₹{period.endingPrincipal.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-gray-700 mb-2">No Calculations Yet</h3>
                                <p className="text-gray-500">Enter your loan parameters and click calculate to see the results and visualizations.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FinancialActivitiesPage