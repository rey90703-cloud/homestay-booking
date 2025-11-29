Facescape
Interactive, animated user avatars with hover effects and responsive layout.

code

"use client";
import { Facescape } from "@/components/ui/facescape";

export default function FacescapeDemo() {
  const avatars = [
    {
      src: "https://github.com/Adityakishore0.png",
      alt: "@Ahdeetai",
      fallback: "AK",
      name: "Ahdeetai",
    },
    {
      src: "https://github.com/shivam785.png",
      alt: "@shivam785",
      fallback: "S",
      name: "kumar shivam",
    },
    {
      src: "https://github.com/PhatJack.png",
      alt: "@PhatJack",
      fallback: "JP",
      name: "Jack Phat",
    },
    {
      src: "https://github.com/isouravanand.png",
      alt: "@isouravanand",
      fallback: "SA",
      name: "isouravanand",
    },
    {
      src: "https://github.com/srikarnarayanempati.png",
      alt: "@srikarnarayanempati",
      fallback: "SE",
      name: "Srikar Empati",
    },
    {
      src: "https://github.com/gautamkaran.png",
      alt: "@gautamkaran",
      fallback: "KG",
      name: "K K Gautam",
    },
    {
      src: "https://github.com/Abhinav-456.png",
      alt: "@Abhinav-456",
      fallback: "A",
      name: "Abhinav",
    },
    {
      src: "https://github.com/Roshan181.png",
      alt: "@Roshan181",
      fallback: "RM",
      name: "Roshan",
    },
    {
      src: "https://github.com/CarlosSousa2001.png",
      alt: "@CarlosSousa2001",
      fallback: "CS",
      name: "Carlos Sousa",
    },
    {
      src: "https://github.com/albermav.png",
      alt: "@tj",
      fallback: "AL",
      name: "albermav",
    },
    {
      src: "https://github.com/dwin-gharibi.png",
      alt: "@dwin-gharibi",
      fallback: "DG",
      name: "Dwin Gharibi",
    },
    {
      src: "https://github.com/AlexanderAbramovPav.png",
      alt: "@AlexanderAbramovPav",
      fallback: "AP",
      name: "A AbramovPav",
    },
    {
      src: "https://github.com/MiladJoodi.png",
      alt: "@MiladJoodi",
      fallback: "MJ",
      name: "Milad Joodi",
    },
    {
      src: "https://github.com/micaelcf.png",
      alt: "@micaelcf",
      fallback: "ML",
      name: "micaelcf",
    },
    {
      src: "https://github.com/sahillangoo.png",
      alt: "@sahillangoo",
      fallback: "S",
      name: "sahillangoo",
    },
    {
      src: "https://github.com/joaogabriel-sg.png",
      alt: "@joaogabriel-sg",
      fallback: "JR",
      name: "João Gabriel",
    },
    {
      src: "https://github.com/shivam785.png",
      alt: "@shivam785",
      fallback: "S",
      name: "Kumar shivam",
    },
    {
      src: "https://github.com/PhatJack.png",
      alt: "@PhatJack",
      fallback: "JP",
      name: "Jack Phat",
    },
    {
      src: "https://github.com/isouravanand.png",
      alt: "@isouravanand",
      fallback: "SA",
      name: "isouravanand",
    },
    {
      src: "https://github.com/srikarnarayanempati.png",
      alt: "@srikarnarayanempati",
      fallback: "SE",
      name: "Srikar Empati",
    },
    {
      src: "https://github.com/gautamkaran.png",
      alt: "@gautamkaran",
      fallback: "KG",
      name: "K K Gautam",
    },
    {
      src: "https://github.com/Abhinav-456.png",
      alt: "@Abhinav-456",
      fallback: "A",
      name: "Abhinav",
    },
    {
      src: "https://github.com/Roshan181.png",
      alt: "@Roshan181",
      fallback: "RM",
      name: "Roshan",
    },
    {
      src: "https://github.com/CarlosSousa2001.png",
      alt: "@CarlosSousa2001",
      fallback: "CS",
      name: "Carlos Sousa",
    },
    {
      src: "https://github.com/albermav.png",
      alt: "@tj",
      fallback: "AL",
      name: "albermav",
    },
    {
      src: "https://github.com/dwin-gharibi.png",
      alt: "@dwin-gharibi",
      fallback: "DG",
      name: "Dwin Gharibi",
    },
    {
      src: "https://github.com/AlexanderAbramovPav.png",
      alt: "@AlexanderAbramovPav",
      fallback: "AP",
      name: "A AbramovPav",
    },
    {
      src: "https://github.com/MiladJoodi.png",
      alt: "@MiladJoodi",
      fallback: "MJ",
      name: "Milad Joodi",
    },
    {
      src: "https://github.com/micaelcf.png",
      alt: "@micaelcf",
      fallback: "ML",
      name: "micaelcf",
    },
    {
      src: "https://github.com/sahillangoo.png",
      alt: "@sahillangoo",
      fallback: "S",
      name: "sahillangoo",
    },
    {
      src: "https://github.com/shivam785.png",
      alt: "@shivam785",
      fallback: "S",
      name: "Kumar shivam",
    },
    {
      src: "https://github.com/PhatJack.png",
      alt: "@PhatJack",
      fallback: "JP",
      name: "Jack Phat",
    },
    {
      src: "https://github.com/isouravanand.png",
      alt: "@isouravanand",
      fallback: "SA",
      name: "isouravanand",
    },
    {
      src: "https://github.com/srikarnarayanempati.png",
      alt: "@srikarnarayanempati",
      fallback: "SE",
      name: "Srikar Empati",
    },
    {
      src: "https://github.com/gautamkaran.png",
      alt: "@gautamkaran",
      fallback: "KG",
      name: "K K Gautam",
    },
    {
      src: "https://github.com/Abhinav-456.png",
      alt: "@Abhinav-456",
      fallback: "A",
      name: "Abhinav",
    },
    {
      src: "https://github.com/Roshan181.png",
      alt: "@Roshan181",
      fallback: "RM",
      name: "Roshan",
    },
    {
      src: "https://github.com/CarlosSousa2001.png",
      alt: "@CarlosSousa2001",
      fallback: "CS",
      name: "Carlos Sousa",
    },
    {
      src: "https://github.com/albermav.png",
      alt: "@tj",
      fallback: "AL",
      name: "albermav",
    },
    {
      src: "https://github.com/dwin-gharibi.png",
      alt: "@dwin-gharibi",
      fallback: "DG",
      name: "Dwin Gharibi",
    },
    {
      src: "https://github.com/AlexanderAbramovPav.png",
      alt: "@AlexanderAbramovPav",
      fallback: "AP",
      name: "A AbramovPav",
    },
    {
      src: "https://github.com/isouravanand.png",
      alt: "@isouravanand",
      fallback: "SA",
      name: "isouravanand",
    },
    {
      src: "https://github.com/srikarnarayanempati.png",
      alt: "@srikarnarayanempati",
      fallback: "SE",
      name: "Srikar Empati",
    },
    {
      src: "https://github.com/gautamkaran.png",
      alt: "@gautamkaran",
      fallback: "KG",
      name: "K K Gautam",
    },
    {
      src: "https://github.com/Abhinav-456.png",
      alt: "@Abhinav-456",
      fallback: "A",
      name: "Abhinav",
    },
    {
      src: "https://github.com/MiladJoodi.png",
      alt: "@MiladJoodi",
      fallback: "MJ",
      name: "Milad Joodi",
    },
    {
      src: "https://github.com/micaelcf.png",
      alt: "@micaelcf",
      fallback: "ML",
      name: "micaelcf",
    },
    {
      src: "https://github.com/sahillangoo.png",
      alt: "@sahillangoo",
      fallback: "S",
      name: "sahillangoo",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        Community Heroes Who Supported ScrollX UI
      </h2>

      <Facescape variant="squircle" avatars={avatars} colorDuration={3000} />
    </div>
  );
}
Installation
npx shadcn@latest add https://scrollxui.dev/registry/facescape.json
Usage

import { Facescape } from "@/components/ui/facescape";

<Facescape
  variant="squircle"
  avatars={avatars}
  colorDuration={3000}
  className="max-w-4xl"
/>

API Reference
Facescape
Interactive, animated user avatars with hover effects and responsive layout.

Props
Property	Type	Default	Description
avatars	AvatarData[]	required	
Array of avatar objects containing src, alt, fallback, and name.
className	string	undefined	
Additional Tailwind or custom classes applied to the container.
colorDuration	number	3000	
Duration in ms for hover/autoAnimate color and scale transition.
variant	"circle" | "square" | "squircle"	squircle	
Shape of the avatars. Determines border-radius styling.
ref	Ref<HTMLDivElement>	undefined	
Optional ref for the Facescape container div.
autoAnimate	boolean	false	
Used internally by FacescapeItem to animate avatars on scroll visibility (mobile/tablet).
src	string	required	
Image URL of the avatar. Required for FacescapeItem.
alt	string	required	
Alt text for the avatar image. Required for FacescapeItem.
fallback	string	required	
Fallback text displayed if the image fails to load. Required for FacescapeItem.
name	string	required	
Tooltip name displayed on hover. Required for FacescapeItem.
