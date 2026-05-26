/**
 * Check if a purchase is eligible for return based on the product's return window
 * @param purchaseDate - Date when the product was purchased
 * @param returnWindowDays - Number of days allowed for return (default 30)
 * @returns { isEligible: boolean, daysLeft: number, deadlineDate: Date }
 */
export function checkReturnEligibility(
  purchaseDate: string | Date,
  returnWindowDays: number = 30
): {
  isEligible: boolean;
  daysLeft: number;
  deadlineDate: Date;
  deadlineFormatted: string;
} {
  const purchase = new Date(purchaseDate);
  const today = new Date();
  
  // Calculate deadline date
  const deadline = new Date(purchase);
  deadline.setDate(deadline.getDate() + returnWindowDays);
  
  // Calculate days left
  const diffTime = deadline.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    isEligible: daysLeft > 0,
    daysLeft: Math.max(0, daysLeft),
    deadlineDate: deadline,
    deadlineFormatted: deadline.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };
}

/**
 * Format the return eligibility message for display
 */
export function getReturnEligibilityMessage(
  daysLeft: number,
  isEligible: boolean,
  deadlineFormatted: string
): string {
  if (!isEligible) {
    return `Return window expired. Return deadline was ${deadlineFormatted}`;
  }
  
  if (daysLeft === 1) {
    return `Last day to return! Deadline: ${deadlineFormatted}`;
  }
  
  return `${daysLeft} days left to return (Deadline: ${deadlineFormatted})`;
}
