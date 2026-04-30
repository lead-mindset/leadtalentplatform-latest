import { MainContainer } from "@/components/global/main-container";

const GALLERY_IMAGES = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuG4Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9X",
    alt: "Community Event 1",
    overlayColor: "bg-primary/20",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuH4Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9Y",
    alt: "Community Event 2",
    overlayColor: "bg-accent/20",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuI4Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9Z",
    alt: "Community Event 3",
    overlayColor: "bg-primary/20",
  },
];

export function Gallery() {
  return (
    <section className="py-24 bg-background">
      <MainContainer>
        <h2 className="fluid-h1 mb-16 text-center">
          Our Community in Motion
        </h2>
        <div className="masonry">
          {GALLERY_IMAGES.map((image, index) => (
            <div 
              key={index} 
              className="mb-6 rounded-2xl overflow-hidden shadow-xl border border-border/20 group relative break-inside-avoid"
              style={{ aspectRatio: '16/9' }}
            >
              <div className={`absolute inset-0 ${image.overlayColor} mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10`}></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                alt={image.alt} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                src={image.src}
                loading="lazy"
                width={800}
                height={450}
              />
            </div>
          ))}
        </div>
      </MainContainer>
    </section>
  );
}
