import { Link } from "@tanstack/react-router";
import ClerkHeader from "../integrations/clerk/header-user.tsx";
import TanStackChatHeaderUser from "../integrations/tanchat/header-user.tsx";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

export default function Header() {
  return (
    <header className="flex sticky top-0 z-50 justify-between items-center px-4 w-full h-16 border-b md:px-6 shrink-0 bg-background">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/" className={navigationMenuTriggerStyle()}>
                Home
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/demo/tanstack-query"
                className={navigationMenuTriggerStyle()}
              >
                TanStack Query
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/example/chat" className={navigationMenuTriggerStyle()}>
                Chat
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/demo/store" className={navigationMenuTriggerStyle()}>
                Store
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex gap-2 items-center">
        <ClerkHeader />
        <TanStackChatHeaderUser />
      </div>
    </header>
  );
}
