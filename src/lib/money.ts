/** All money is integer paise. Format for display in INR. */
export function formatINR(paise: number | null | undefined): string {
  if (paise == null) return "Price to be confirmed";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees);
}
