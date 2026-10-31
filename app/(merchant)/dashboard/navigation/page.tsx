"use client";

import * as React from "react";
import { useDataStore } from "@/lib/store/data-store";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { MenuEditor, MenuPicker } from "@/components/settings/menu-editor";

export default function NavigationPage() {
  const menus = useDataStore((state) => state.navMenus);
  const [activeMenuId, setActiveMenuId] = React.useState(menus[0]?.id ?? "");

  return (
    <Page>
      <PageHeader
        title="Navigation"
        description="Menus shown in the storefront header and footer. Changes apply immediately in the demo."
        actions={<MenuPicker value={activeMenuId} onChange={setActiveMenuId} />}
      />
      <MenuEditor menuId={activeMenuId} />
    </Page>
  );
}
