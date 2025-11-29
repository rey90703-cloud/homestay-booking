Transition
Smooth page transitions with curved or slide effects.

preview
code

"use client";

import { useState } from "react";
import { Transition } from "@/components/ui/transition";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function TransitionDemo() {
  const [key, setKey] = useState(0);
  const [rotate, setRotate] = useState(false);

  const handleReload = () => {
    setRotate(true);
    setKey((prev) => prev + 1);
    setTimeout(() => setRotate(false), 600);
  };

  return (
    <div className="relative w-full min-h-[350px] flex items-center justify-center">
      <Transition
        key={key}
        introDuration={1.5}
        transitionDuration={1.0}
        type="curved"
        direction="bottom"
        autoExit
        className="bg-black dark:bg-white"
        intro={
          <div className="flex flex-col items-center justify-center h-full w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white dark:text-black">
              ScrollX UI
            </h1>
            <p className="mt-2 text-base md:text-lg text-gray-400 dark:text-gray-600">
              Build modern interfaces with ease
            </p>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center min-h-[350px] w-full space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white text-center">
            Smooth transitions,
            <br />
            zero effort.
          </h2>

          <Button
            onClick={handleReload}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <motion.div
              animate={{ rotate: rotate ? 360 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
            <span>Replay Transition</span>
          </Button>
        </div>
      </Transition>
    </div>
  );
}
Installation
npx shadcn@latest add https://scrollxui.dev/registry/transition.json
Usage

import Transition from "@/components/ui/transition";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Transition
      intro={
        <div className="text-center text-white dark:text-black">
          <h1 className="text-3xl font-bold">Welcome!</h1>
        </div>
      }
      introDuration={2}
      transitionDuration={1}
      type="curved"
      direction="bottom"
    >
      {children}
    </Transition>
  );
}
API Reference
Transition
Smooth page transitions with curved or slide effects.

Props
Property	Type	Default	Description
intro	ReactNode | (triggerExit: () => void) => ReactNode	required	
Content or function shown during the intro animation.
children	ReactNode	required	
Main content displayed after the intro transition completes.
introDuration	number	1.5	
Duration in seconds for which the intro is displayed.
transitionDuration	number	0.9	
Time in seconds for the transition animation to complete.
type	'curved' | 'slide'	curved	
Transition style: curved clipping or sliding effect.
direction	'top' | 'bottom' | 'left' | 'right'	bottom	
Direction from which the transition occurs.
className	string	-	
CSS classes applied to the overlay element.
skip	boolean		
If true, skips the intro animation and immediately shows content.
autoExit	boolean		
If true, automatically starts exit transition after introDuration.
trigger	boolean	-	
Optional external trigger to start the transition manually.
onFinished	() => void	-	
Callback fired when the transition completes.
