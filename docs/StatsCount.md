StatsCount
Animated statistics counter with responsive layout and scroll triggers.

preview
code

import StatsCount from "@/components/ui/statscount";
const stats = [
  { value: 30, suffix: "+", label: "Handcrafted animated components" },
  { value: 12, suffix: "K+", label: "Developers building with ScrollX-UI" },
  { value: 99, suffix: "%", label: "Performance optimized for web" },
];
export default function StatsCountDemo() {
  return (
    <StatsCount
      stats={stats}
      title="CREATE STUNNING INTERFACES WITH SCROLLX UI COMPONENTS"
      showDividers={true}
      className=""
    />
  );
}
Installation
npx shadcn@latest add https://scrollxui.dev/registry/statscount.json
Usage

import StatsCount from "@/components/ui/statscount";
 
 const stats = [
   { value: 30, suffix: "+", label: "Handcrafted animated components" },
   { value: 12, suffix: "K+", label: "Developers building with ScrollX-UI"},
   { value: 99, suffix: "%", label: "Performance optimized for web"},
 ];

<StatsCount
    stats={stats}
    title="CREATE STUNNING INTERFACES WITH SCROLLX-UI COMPONENTS"
    showDividers={true}
    className=""
  />
API Reference
StatsCount
The root component for displaying animated, responsive statistics counters with optional scroll-triggered animations.

Props
Property	Type	Default	Description
stats	Array<{ value: number; suffix?: string; label: string; duration?: number }>	—	
Array of stat items with value, label, optional suffix, and animation duration.
title	string	—	
Custom title text; splits on 'WITH' for responsiveness.
showDividers	boolean	true	
Show or hide vertical divider lines.
className	string	—	
Optional class for styling the container.
