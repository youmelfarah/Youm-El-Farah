export interface JourneyChipDefinition {
  slug: string;
  label: string;
}

export interface JourneyImageConfig {
  cloudinaryPublicId?: string | null;
  fallbackUrl: string;
  alt: string;
}

export interface JourneyStopData {
  id: string;
  stepNumber: number;
  title: string;
  text: string;
  chips: JourneyChipDefinition[];
  /** Single circular image for stops 1, 2, 3, 5 */
  image?: JourneyImageConfig;
  /** Two overlapping circular images for stop 4 */
  dualImages?: [JourneyImageConfig, JourneyImageConfig];
}

export interface JourneyContent {
  eyebrow?: string;
  title: string;
  paragraph: string;
  stops: JourneyStopData[];
}

export const journeyContent: JourneyContent = {
  eyebrow: "THE WEDDING DAY",
  title: "رحلة العروسة في يوم الفرح",
  paragraph:
    "من أول ما تطلع من بيتها لحد ما تدخل القاعة، كل محطة فيها ناس بتجهّزلها اللي تحتاجه. اضغطي على أي خدمة وشوفي المتاح في يوم فرحك.",
  stops: [
    {
      id: "wedding-car",
      stepNumber: 1,
      title: "من البيت للفندق",
      text: "الزفة الأولى. العربية بتوصّلها لمكان التجهيز.",
      chips: [
        { slug: "wedding-car", label: "عربية العرس" },
        { slug: "hotels", label: "الفنادق" },
      ],
      image: {
        cloudinaryPublicId: null,
        fallbackUrl: "/demo-images/journey/01-wedding-car.webp",
        alt: "عربية العرس - الزفة الأولى من البيت للفندق",
      },
    },
    {
      id: "hotel-room",
      stepNumber: 2,
      title: "أوضتها في الفندق",
      text: "هنا بيتجمع فريق التجهيز: الشعر والميك أب والفستان والديكور.",
      chips: [
        { slug: "makeup-artist", label: "ميك أب ارتيست" },
        { slug: "hair-artist", label: "هير ستايلست" },
        { slug: "atelier", label: "الأتيليه" },
        { slug: "dress-accessories", label: "إكسسوارات الفستان" },
        { slug: "decorations", label: "الديكور" },
        { slug: "media-coverage", label: "تغطية إعلامية" },
      ],
      image: {
        cloudinaryPublicId: null,
        fallbackUrl: "/demo-images/journey/02-getting-ready.webp",
        alt: "أوضة التجهيز في الفندق مع فريق العمل",
      },
    },
    {
      id: "photo-session",
      stepNumber: 3,
      title: "جلسة التصوير",
      text: "بعد التجهيزات، تروح للمكان اللي اختارته، والكاميرات معاها.",
      chips: [
        { slug: "photo-session-locations", label: "أماكن السيشنز" },
        { slug: "photographer", label: "مصور فوتوغرافي" },
        { slug: "videographer", label: "مصور فيديو" },
      ],
      image: {
        cloudinaryPublicId: null,
        fallbackUrl: "/demo-images/journey/03-photo-session.webp",
        alt: "جلسة التصوير للعروسين",
      },
    },
    {
      id: "ceremony",
      stepNumber: 4,
      title: "الصلاة وكتب الكتاب",
      text: "لحظة هادية في مسجد أو كنيسة، من غير خدمات هنا. الرحلة بتكمل بعدها.",
      chips: [],
      dualImages: [
        {
          cloudinaryPublicId: null,
          fallbackUrl: "/demo-images/journey/04a-katb-ketab-hands.webp",
          alt: "أيادي العروسين تحت منديل كتب الكتاب التقليدي",
        },
        {
          cloudinaryPublicId: null,
          fallbackUrl: "/demo-images/journey/04b-church-crowns.webp",
          alt: "إكليل وتتويج العروسين في الكنيسة",
        },
      ],
    },
    {
      id: "venue",
      stepNumber: 5,
      title: "القاعة",
      text: "الدخول والكوشة والسهرة. كل حاجة اتجهّزت من بدري.",
      chips: [
        { slug: "venues", label: "القاعات" },
        { slug: "wedding-planner", label: "ويدنج بلانر" },
      ],
      image: {
        cloudinaryPublicId: null,
        fallbackUrl: "/demo-images/journey/05-wedding-hall.webp",
        alt: "قاعة الفرح والكوشة",
      },
    },
  ],
};
