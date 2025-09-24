/**
 * Defines the structure for a single period in the calculation breakdown.
 */
interface BreakdownPeriod {
    period: number;
    label: string;
    startingPrincipal: number;
    interestEarned: number;
    endingPrincipal: number;
}

/**
 * Defines the structure for the final result object returned by the function.
 */
interface InterestCalculationResult {
    inputs: {
        principal: number;
        monthlyRate: number;
        totalMonths: number;
        compoundingInterval: number;
    };
    totalAmount: number;
    breakdown: BreakdownPeriod[];
}


/**
 * Calculates the final amount of a loan with periodic compounding using TypeScript.
 *
 * @param principal The initial principal amount.
 * @param monthlyRate The interest rate per month (e.g., 2.5 for 2.5%).
 * @param totalMonths The total duration of the loan in months.
 * @param compoundingInterval The frequency of compounding in months.
 * @returns An object containing the total amount and a detailed breakdown.
 */
function calculateCompoundInterest(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    compoundingInterval: number
): InterestCalculationResult {
    // 1. Validate the inputs (TypeScript already helps, but runtime check is good)
    if (
        typeof principal !== 'number' ||
        typeof monthlyRate !== 'number' ||
        typeof totalMonths !== 'number' ||
        typeof compoundingInterval !== 'number'
    ) {
        throw new Error('Invalid input. All parameters must be valid numbers.');
    }

    // 2. Initialize variables for calculation
    let currentPrincipal = principal;
    const rateAsDecimal = monthlyRate / 100;
    const breakdown: BreakdownPeriod[] = []; // Typed array

    const numFullPeriods = Math.floor(totalMonths / compoundingInterval);
    const remainingMonths = totalMonths % compoundingInterval;

    // 3. Loop through each full compounding period
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

    // 4. Calculate interest for the remaining months
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

    // 5. Return the final structured and typed result
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

// Export the function and interfaces
export { calculateCompoundInterest, type BreakdownPeriod, type InterestCalculationResult };