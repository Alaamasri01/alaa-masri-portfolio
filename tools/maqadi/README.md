# مقاضي — the weekly data run

The app in `maqadi/` is static. Everything that changes from week to week lives
in `maqadi/data/`, and is produced here once a week (Saudi supermarket offers
usually run Wednesday to Tuesday).

## Stores

| Store | Source | How it is read | Effort each week |
|---|---|---|---|
| العثيم (Othaim) | official weekly flyer PDF | transcribed from page images | high: every page is read by hand or by a vision model |
| التميمي (Tamimi) | public "Weekly offers" listing on tamimimarkets.com | `fetch-tamimi.mjs`, no transcription | low: one command |

Tamimi's listing is read page by page with a two-second pause, only from the
public `/tag/` pages that the site's robots.txt allows (never `/api/`). Only
items the store marks as discounted, with an old price above the new one, are
kept. Its prices are a snapshot of the online store on the day they were read
(`checked` in meta.json), not a printed validity period. Review each store's
terms of use before any public launch.

```sh
node tools/maqadi/fetch-tamimi.mjs 2026-w48   # writes weeks/2026-w48/tamimi/online.json
```

## Steps for the flyer

1. **Get the flyers.** Download each store's official weekly flyer.
   Othaim publishes its PDF at <https://www.othaimmarkets.com/ar/offers/weekly-promotions>
   (the page embeds a `/api/pdfOffers/<id>.pdf` link).
2. **Read the offers.** Render the food pages to images (`pdftoppm -r 150`,
   each page split into two overlapping halves so small print stays legible)
   and transcribe every offer into JSON files under
   `weeks/<week>/<store>/`. One object per offer: `page`, `name_ar`, `name_en`,
   `brand`, `size_text`, `size_qty`, `size_unit`, `pack_count`, `sold_by`,
   `price`, `was`, `promo`, `note`, `category`, `confidence`.
   Transcribe only what is printed; anything unreadable is `null` with
   `confidence: "low"` and is left out of the published data.
3. **Describe the week** in `weeks/<week>/meta.json`: stores, validity dates,
   source links. `corrections` fixes single fields by offer id after a second
   look at the page; `drop` removes an offer by id.
4. **Write the plans** in `weeks/<week>/plans.json`: meals whose main
   ingredients are on offer this week. Every ingredient that points at an offer
   gives its amount in the unit that offer is sold by (g/kg, ml/l or pcs).
5. **Build and test.**

   ```sh
   node tools/maqadi/fetch-tamimi.mjs 2026-w48
   node tools/maqadi/build-data.mjs 2026-w48
   node --test tests/maqadi/*.test.mjs
   ```

   The build stops if a plan points at a missing offer or asks for an amount
   that cannot be bought from it. Offer ids are `<store>-<page>-<n>` in the
   order the offers appear in the source files.
6. **Check before publishing.** Re-read on the flyer page every offer the plans
   use, since those prices decide what the shopper is told to pay.

## Rules the data follows

- Prices are copied from the stores' published flyers, never estimated.
- A saving is shown only where the flyer prints the price before the offer.
- Restrictions printed on the flyer (selected branches, loyalty members only)
  travel with the offer in `note`.
