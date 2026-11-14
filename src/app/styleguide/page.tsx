import { notFound } from "next/navigation";
import { StyleGuideClient } from "./client";

export const metadata = {
  title: "دليل الهوية ونظام التصميم | يوم الفرح",
  description: "لوحة مراجعة نظام التصميم والمكونات والألوان والطباعة",
};

export default function StyleGuidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <StyleGuideClient />;
}
