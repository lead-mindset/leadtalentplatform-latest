"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap-setup";
import { SectionLabel } from "@/components/ui/section-label";

const images = [
  "/allies/accenturemini.png",
  "/allies/alpfa.png",
  "/allies/ibm.png",
  "/allies/microsoftmini.png",
  "/allies/peruviansinstem.jpg",
  "/allies/shpe.webp",
];

export function Allies() {
  const t = useTranslations("homepage");
  const rowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const row = rowRef.current;
    if (!row) return;

    const totalWidth = row.scrollWidth / 2;

    gsap.set(row, { x: 0 });

    gsap.to(row, {
      x: -totalWidth,
      duration: 40,
      ease: "none",
      repeat: -1,
    });
  }, { scope: rowRef });

  return (
    <section className="pt-12 pb-8 bg-foreground border-y border-border/10">
      <div className="container mx-auto px-4">
        <SectionLabel size="sm" className="text-center mb-2">{t("alliesLabel")}</SectionLabel>
        <div className="relative overflow-hidden">
          <div
            ref={rowRef}
            className="flex items-center gap-10 will-change-transform"
          >
            {[...images, ...images].map((src, i) => (
              <div
                key={i}
                className="shrink-0 h-16 p-4 lg:p-6 lg:h-28"
              >
                <Image
                  src={src}
                  alt={`Partner ${i + 1}`}
                  width={400}
                  height={200}
                  className="h-full w-auto object-contain"
                  priority={i < images.length}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
