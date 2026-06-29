export interface CatalogProduct {
  title: string;
  vendor: string;
  price: string;
  url: string;
  image?: string;
}

const catalogProducts: Record<string, CatalogProduct[]> = {
  clothing: [
    {
      title: "Boxy poplin shirt",
      vendor: "William Frederick",
      price: "$248",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Washed chore jacket",
      vendor: "Document",
      price: "$420",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Cotton rib vest",
      vendor: "Yahae",
      price: "$112",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Relaxed wool trouser",
      vendor: "Sage Nation",
      price: "$365",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Canvas deck shoe",
      vendor: "Hender Scheme",
      price: "$310",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Open-collar overshirt",
      vendor: "Blanc YM",
      price: "$285",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Garment-dyed tee",
      vendor: "Mittan",
      price: "$96",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Linen work short",
      vendor: "Ancellm",
      price: "$198",
      url: "https://shopandson.com/collections/clothing",
    },
    {
      title: "Fine cotton sock",
      vendor: "Yleve",
      price: "$42",
      url: "https://shopandson.com/collections/clothing",
    },
  ],
  house: [
    {
      title: "Hand-thrown cup",
      vendor: "Shino Takeda",
      price: "$74",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Cypress bath soap",
      vendor: "Binu Binu",
      price: "$22",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Small stoneware bowl",
      vendor: "Danny D's Mud Shop",
      price: "$96",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Folded linen towel",
      vendor: "Miscellaneous",
      price: "$58",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Brass desk tray",
      vendor: "Mark Patrick Harrington",
      price: "$135",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Rice paper shade",
      vendor: "Miscellaneous",
      price: "$188",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Cedar incense rest",
      vendor: "Binu Binu",
      price: "$34",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Thrown side plate",
      vendor: "Shino Takeda",
      price: "$82",
      url: "https://shopandson.com/collections/house",
    },
    {
      title: "Walnut wall peg",
      vendor: "Miscellaneous",
      price: "$48",
      url: "https://shopandson.com/collections/house",
    },
  ],
};

export async function getCatalogProducts(collection: string): Promise<CatalogProduct[]> {
  // TODO C2: replace this mock lookup with a Shopify Storefront collection fetch.
  return catalogProducts[collection] ?? [];
}
