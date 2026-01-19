"use client";
import { motion } from "framer-motion";

export const Hero = () => {
  const title = "Talent Platform";
  const words = title.split("LEAD");
  return (
    <div className="min-h-[calc(100vh-64px)]  flex flex-col items-center justify-center  bg-background">

      <img src="/lead_logo.svg" alt="Logo" className="max-w-md mb-10" />

      <div className="mx-auto px-4 md:px-6 ">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, var(--gradient-from), var(--gradient-to))",
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>
        </motion.div>
      </div>
    </div>
  );
};
