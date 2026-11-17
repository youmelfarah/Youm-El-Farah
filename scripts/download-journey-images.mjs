import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IMAGES = [
  {
    fileName: "01-wedding-car.webp",
    stop: "Stop 1: من البيت للفندق",
    id: "mQnbjWvx8sM",
    title: "A wedding car decorated with a bouquet of flowers",
    photographer: "Valdemars Magone",
    photographerUrl: "https://unsplash.com/@vmgn021",
    sourceUrl: "https://unsplash.com/photos/a-wedding-car-decorated-with-a-bouquet-of-flowers-mQnbjWvx8sM",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
  {
    fileName: "02-getting-ready.webp",
    stop: "Stop 2: أوضتها في الفندق",
    id: "S08VfhoKhQI",
    title: "Bride getting makeup applied before wedding ceremony",
    photographer: "engin akyurt",
    photographerUrl: "https://unsplash.com/@enginakyurt",
    sourceUrl: "https://unsplash.com/photos/bride-getting-makeup-applied-before-wedding-ceremony-S08VfhoKhQI",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
  {
    fileName: "03-photo-session.webp",
    stop: "Stop 3: جلسة التصوير",
    id: "YT9Yi1l6LKA",
    title: "Bride and groom posing outdoors with greenery",
    photographer: "Sabesh Photography LTD",
    photographerUrl: "https://unsplash.com/@sabeshphotos",
    sourceUrl: "https://unsplash.com/photos/bride-and-groom-posing-outdoors-with-greenery-YT9Yi1l6LKA",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
  {
    fileName: "04a-katb-ketab-hands.webp",
    stop: "Stop 4: الصلاة وكتب الكتاب (الصورة الأولى: كتب الكتاب)",
    id: "tOU5pWBOWR4",
    title: "Wedding rings on hands of a couple under lace handkerchief",
    photographer: "Guillaume Dhalluin",
    photographerUrl: "https://unsplash.com/@guillaumedhalluin",
    sourceUrl: "https://unsplash.com/photos/wedding-rings-on-hands-of-a-couple-tOU5pWBOWR4",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
  {
    fileName: "04b-church-crowns.webp",
    stop: "Stop 4: الصلاة وكتب الكتاب (الصورة الثانية: إكليل الكنيسة)",
    id: "F5DUd_daveA",
    title: "Priest crowns bride and groom during a religious ceremony",
    photographer: "Ana Curcan",
    photographerUrl: "https://unsplash.com/@annaacurcan",
    sourceUrl: "https://unsplash.com/photos/priest-crowns-bride-and-groom-during-a-religious-ceremony-F5DUd_daveA",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
  {
    fileName: "05-wedding-hall.webp",
    stop: "Stop 5: القاعة",
    id: "T5v5i67QYGk",
    title: "Elegant ballroom with long tables, chandeliers, and tall columns",
    photographer: "Jonathan Borba",
    photographerUrl: "https://unsplash.com/@jonathanborba",
    sourceUrl: "https://unsplash.com/photos/elegant-ballroom-with-long-tables-chandeliers-and-tall-columns-T5v5i67QYGk",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
  {
    fileName: "06-wedding-car-alt.webp",
    stop: "Alternative / Extra: سيارة عرس بيضاء",
    id: "VUggvNYNUFg",
    title: "A white car with a flower arrangement on the hood",
    photographer: "Mike Cho",
    photographerUrl: "https://unsplash.com/@mike_cho",
    sourceUrl: "https://unsplash.com/photos/a-white-car-with-a-flower-arrangement-on-the-hood-VUggvNYNUFg",
    license: "Unsplash License (Free commercial & non-commercial use)",
  },
];

async function run() {
  const outputDir = path.resolve(process.cwd(), "public/demo-images/journey");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Starting download and processing of ${IMAGES.length} demo images...`);

  for (const item of IMAGES) {
    const destPath = path.join(outputDir, item.fileName);
    console.log(`Downloading ${item.fileName} (${item.title})...`);

    const downloadEndpoint = `https://unsplash.com/photos/${item.id}/download?force=true`;
    const redirectRes = await fetch(downloadEndpoint, { redirect: "manual" });
    const directUrl = redirectRes.headers.get("location");

    if (!directUrl) {
      throw new Error(`Failed to resolve download redirect for photo ${item.id}`);
    }

    const imgRes = await fetch(directUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch image data for ${item.id} (${imgRes.status})`);
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Crop to square (min 800x800 -> 1000x1000) and convert to optimized WebP
    await sharp(buffer)
      .resize(1000, 1000, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85, effort: 6 })
      .toFile(destPath);

    const stats = fs.statSync(destPath);
    console.log(`Saved ${item.fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // Generate public/demo-images/CREDITS.md
  const creditsPath = path.resolve(process.cwd(), "public/demo-images/CREDITS.md");
  let creditsContent = `# Demo Images Credits & Licenses\n\n`;
  creditsContent += `This directory contains temporary demo images used for the "Bride's Journey" section until replaced by Cloudinary production images.\n\n`;
  creditsContent += `All images are free to use under the **Unsplash License** (commercial and non-commercial use, no permission needed).\n\n`;
  creditsContent += `| File | Stop / Role | Title | Photographer | Source Link | License |\n`;
  creditsContent += `|:-----|:------------|:------|:-------------|:------------|:--------|\n`;

  for (const img of IMAGES) {
    creditsContent += `| \`journey/${img.fileName}\` | ${img.stop} | ${img.title} | [${img.photographer}](${img.photographerUrl}) | [Unsplash Photo](${img.sourceUrl}) | [Unsplash License](${img.license}) |\n`;
  }

  creditsContent += `\n*Generated on ${new Date().toISOString()}*\n`;

  fs.writeFileSync(creditsPath, creditsContent, "utf8");
  console.log(`\nUpdated credits file: ${creditsPath}`);
  console.log("All demo images successfully downloaded and processed!");
}

run().catch((err) => {
  console.error("Error downloading images:", err);
  process.exit(1);
});
