Expandable Cards
Interactive card layout where hovered cards expand smoothly for focused content viewing.

code

"use client";
import ExpandableCards from "@/components/ui/expandable-cards";

export default function ExpandableCardsDemo() {
  const cards = [
    {
      id: 1,
      content: (
        <img
          src="https://cdn.pixabay.com/photo/2023/06/26/04/38/ai-generated-8088680_1280.jpg"
          className="w-full h-full object-cover"
          alt=""
        />
      ),
    },
    {
      id: 2,
      content: (
        <img
          src="https://cdn.pixabay.com/photo/2024/08/01/18/20/anime-8937917_1280.png"
          className="w-full h-full object-cover"
          alt=""
        />
      ),
    },
    {
      id: 3,
      content: (
        <img
          src="https://github.com/Adityakishore0.png"
          className="w-full h-full object-cover"
          alt=""
        />
      ),
    },
    {
      id: 4,
      content: (
        <img
          src="https://cdn.pixabay.com/photo/2023/02/07/10/50/ai-generated-7773822_1280.jpg"
          className="w-full h-full object-cover scale-x-[-1]"
          alt=""
        />
      ),
    },
    {
      id: 5,
      content: (
        <img
          src="https://cdn.pixabay.com/photo/2023/06/27/03/15/ai-generated-8091289_1280.jpg"
          className="w-full h-full object-cover"
          alt=""
        />
      ),
    },
  ];

  return (
    <div className="h-[100px] sm:h-[300px] w-full select-none">
      <ExpandableCards cards={cards} defaultExpanded={3} />
    </div>
  );
}
Installation
CLI
npm

npx shadcn@latest add https://scrollxui.dev/registry/expandable-cards.json 
Usage

import ExpandableCards from "@/components/ui/expandable-cards";

<div className="h-[100px] sm:h-[300px] w-full select-none">
  <ExpandableCards
    cards={cards}
    defaultExpanded={3}
  />
</div>
API Reference
Expandable Cards
Interactive card layout where hovered cards expand smoothly for focused content viewing.

Props
Property	Type	Default	Description
cards	ExpandableCard[]	required	
Array of card objects, each containing an id and JSX content.
defaultExpanded	number	1	
ID of the card that should be expanded initially.
className	string	—	
Optional additional class for custom styling of the container.
