Type Animation
Displays an animated typing effect.

preview
code

import Typeanimation from "@/components/ui/typeanimation";

export default function TypeAnimationDemo() {
  return (
    <div className="flex items-center justify-center ">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-primary mb-2">
          Discover New
        </h1>
        <Typeanimation
          words={[" possibilities", " opportunities", " potential"]}
          typingSpeed="slow"
          deletingSpeed="slow"
          gradientFrom="red-500"
          gradientTo="yellow-500"
          pauseDuration={2000}
          className="text-3xl md:text-5xl font-extrabold text-teal-600"
        />
      </div>
    </div>
  );
}
Installation
npx shadcn@latest add https://scrollxui.dev/registry/typeanimation.json
Usage

import Typeanimation from '@/components/ui/typeanimation';

<Typeanimation
    words={[' possibilities', ' opportunities', ' potential']}
    typingSpeed="slow"
    deletingSpeed="slow"
    pauseDuration={2000}
    className="text-3xl md:text-5xl font-extrabold text-teal-600"
  />
API Reference
Typeanimation
Displays an animated typing effect with gradient text.

Props
Property	Type	Default	Description
words	string[]	required	
Array of words to animate through the typing effect
className	string	—	
Optional class name for custom styling
typingSpeed	number | 'slow' | 'normal' | 'fast'	50	
Typing speed in milliseconds or preset speed values
deletingSpeed	number | 'slow' | 'normal' | 'fast'	50	
Deleting speed in milliseconds or preset speed values
pauseDuration	number	1000	
Delay between each word transition in milliseconds
gradientFrom	string	'blue-500'	
Tailwind color suffix for gradient start color
gradientTo	string	'purple-600'	
Tailwind color suffix for gradient end color
