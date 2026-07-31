export function isOnSale(
  priceAmount: string | null | undefined,
  compareAtAmount: string | null | undefined,
): boolean {
  const price = Number.parseFloat(priceAmount ?? "");
  const compareAtPrice = Number.parseFloat(compareAtAmount ?? "");

  return Number.isFinite(price) && Number.isFinite(compareAtPrice) && compareAtPrice > price;
}

interface MoneyCandidate {
  amount: string;
  currencyCode: string;
}

type PriceCandidate = string | MoneyCandidate;

interface SaleVariantCandidate {
  price: PriceCandidate;
  compareAtPrice?: PriceCandidate | null;
}

const getAmount = (price: PriceCandidate | null | undefined): string | undefined =>
  typeof price === "string" ? price : price?.amount;

const getCurrencyCode = (price: PriceCandidate | null | undefined): string | undefined =>
  typeof price === "string" ? undefined : price?.currencyCode;

export function findLowestOnSaleVariant<T extends SaleVariantCandidate>(variants: T[]): T | undefined {
  return variants
    .filter((variant) => {
      const priceCurrencyCode = getCurrencyCode(variant.price);
      const compareAtCurrencyCode = getCurrencyCode(variant.compareAtPrice);
      const currenciesMatch =
        (priceCurrencyCode === undefined && compareAtCurrencyCode === undefined) ||
        (priceCurrencyCode !== undefined && priceCurrencyCode === compareAtCurrencyCode);

      return currenciesMatch && isOnSale(getAmount(variant.price), getAmount(variant.compareAtPrice));
    })
    .sort(
      (left, right) =>
        Number.parseFloat(getAmount(left.price) ?? "") -
        Number.parseFloat(getAmount(right.price) ?? ""),
    )[0];
}
