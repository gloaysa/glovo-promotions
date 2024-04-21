import puppeteer from "puppeteer";
import express from "express";

const app = express();
app.use(express.json());

interface PromotionData {
  title: string | undefined;
  description: string | undefined;
  discount: string | undefined;
  currentPrice: string | undefined;
  oldPrice: string | undefined;
  image: string | undefined;
}

app.post("/promotions", async (req, res) => {
  if (!req.body) {
    console.error("Invalid request", req.body)
    return res.status(400).send("Invalid request. Missing body data or invalid JSON format. Please provide restaurantUrl and offer in the request body.");
  }
  const { restaurantUrl, offers }: {restaurantUrl: string, offers: string} = req.body;
  if (!restaurantUrl || !offers) {
    console.error("Invalid request", req.body)
    return res.status(400).send("Invalid request. Missing restaurantUrl or offers in the request body. Offers should be an array of strings.");
  }
  // if retaurantUrl is not valid url, return 400
  if (!restaurantUrl.match(/^(http|https):\/\/[^ "]+$/)) {
    return res.status(400).send("Invalid restaurant url");
  }

  console.log("Request received", req.body)

  const offersArray = offers.trim().split(",").map((offer) => offer.trim().toLowerCase());

  console.log("Offers array", offersArray)

  const popeyesPromos = await getRestaurantPromos(restaurantUrl, offersArray);

  if (popeyesPromos?.length) {
    // creates html message
    const message =
      "\n-------------" +
      popeyesPromos
        .map((promo) => {
          return `\n*${promo.title}*\n_${promo.description}_\n- Discount: ${promo.discount}\n- Current Price: ${promo.currentPrice}\n${promo.oldPrice ? `- Old Price: ${promo.oldPrice}\n` : ""}`;
        })
        .join(",")
        .replace(/\n,/g, "\n");

    console.info("Success", message);
    return res.status(200).send(message);
  }
  console.info("No promotions found");
  return res.status(404).send("No promotions found")
});

async function getRestaurantPromos(restaurantUrl: string, offers: string[]): Promise<PromotionData[] | undefined> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(restaurantUrl, {
    waitUntil: "domcontentloaded",
  });

  const promotionsSelector = "#promotions-pr";
  await page.waitForSelector(promotionsSelector);

  const promotions = await page.$$(promotionsSelector + " .product-row");

  if (!promotions) {
    console.log("No promotions found");
    return;
  }

  const promotionsData: PromotionData[] = [];
  // get the content of rows
  for (let i = 0; i < promotions.length; i++) {
    const row = promotions[i];
    const data = await page.evaluate((row) => {
      const titleElement = row.querySelector(".product-row__name");
      const descriptionElement = row.querySelector(
          ".product-row__info__description",
      );
      const discountElement = row.querySelector(
          ".product-row__info__promotion",
      );
      const currentPriceElement = row.querySelector(
          ".product-price__effective",
      );
      const oldPriceElement = row.querySelector(".product-price__original");
      const imageElement = row.querySelector("img"); // Select the image element

      return {
        title: titleElement?.textContent?.trim(),
        description: descriptionElement?.textContent?.trim(),
        discount: discountElement?.textContent?.trim(),
        currentPrice: currentPriceElement?.textContent?.trim(),
        oldPrice: oldPriceElement?.textContent?.trim(),
        image: imageElement?.getAttribute("src") ?? undefined,
      };
    }, row);
    if (!data.title) {
      return;
    }
    if (offers.includes("all") || offers.some((offer) => data.title?.toLowerCase().includes(offer))) {
        promotionsData.push(data);
    }
  }

  await browser.close();
  return promotionsData;
}

app.listen(3501, () => {
  console.log("Express Server running on port 3501");
});
