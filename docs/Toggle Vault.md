Toggle Vault
Animated toggle vault component with trigger, close button, and expandable content panel.

preview
code

import {
  ToggleVault,
  ToggleVaultTrigger,
  ToggleVaultContent,
  ToggleVaultClose,
} from "@/components/ui/toggle-vault";

export default function ToggleVaultDemo() {
  return (
    <div className="relative w-full ">
      <ToggleVault>
        <ToggleVaultTrigger className="w-20 h-8 text-sm">
          MENU
        </ToggleVaultTrigger>
        <ToggleVaultClose className="w-20 h-8 text-sm">
          CLOSE
        </ToggleVaultClose>
        <ToggleVaultContent className="w-[300px] h-[250px] p-8 text-xl flex flex-col gap-4">
          <a href="#home">HOME</a>
          <a href="#about">ABOUT</a>
          <a href="#projects">PROJECTS</a>
          <a href="#contact">CONTACT</a>
        </ToggleVaultContent>
      </ToggleVault>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-center text-2xl md:text-3xl font-semibold">
          Click on the Menu button to see the Effect
        </p>
      </div>
    </div>
  );
}
Installation
npx shadcn@latest add https://scrollxui.dev/registry/toggle-vault.json
Usage

import {
  ToggleVault,
  ToggleVaultTrigger,
  ToggleVaultContent,
  ToggleVaultClose,
} from "@/components/ui/toggle-vault";

<ToggleVault>
  <ToggleVaultTrigger className="w-20 h-8 text-sm">
    MENU
  </ToggleVaultTrigger>
  <ToggleVaultClose className="w-20 h-8 text-sm">
    CLOSE
  </ToggleVaultClose>
  <ToggleVaultContent className="w-[300px] h-[250px] p-8 text-xl flex flex-col gap-4">
    <a href="#home">HOME</a>
    <a href="#about">ABOUT</a>
    <a href="#projects">PROJECTS</a>
    <a href="#contact">CONTACT</a>
  </ToggleVaultContent>
</ToggleVault>
API Reference
Toggle Vault
Expandable vault component with animated open/close, trigger button, and content panel.

Props
Property	Type	Default	Description
children	ReactNode	required	
Nested elements to be rendered inside the component. Required for all ToggleVault components.
className	string	""	
Optional Tailwind or custom classes to style the component.
open	boolean	false	
Internal state representing whether the vault is open. Used in ToggleVault context.
toggleOpen	() => void	required	
Function to toggle the open state of the vault. Provided by ToggleVault context and used by Trigger and Close components.
