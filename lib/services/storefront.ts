"use client";

import type {
  BlogPost,
  Campaign,
  Integration,
  NavMenu,
  StorePage,
  Theme,
  ThemeSettings,
} from "@/lib/types";
import { SEED } from "@/lib/data";
import { useDataStore } from "@/lib/store/data-store";
import { MockApiError, simulateLatency } from "./errors";
import { slugify } from "@/lib/utils";

export const themeService = {
  async list(): Promise<Theme[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().themes;
  },

  async update(id: string, settings: Partial<ThemeSettings>): Promise<Theme> {
    await simulateLatency(140, 120);
    const state = useDataStore.getState();
    const theme = state.themes.find((item) => item.id === id);
    if (!theme) throw new MockApiError("Theme not found.", "not_found", 404);
    const updated: Theme = {
      ...theme,
      settings: { ...theme.settings, ...settings },
      updatedAt: new Date().toISOString(),
    };
    state.patch({ themes: state.themes.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },

  async publish(id: string): Promise<Theme> {
    await simulateLatency(300, 200);
    const state = useDataStore.getState();
    const theme = state.themes.find((item) => item.id === id);
    if (!theme) throw new MockApiError("Theme not found.", "not_found", 404);
    const updated: Theme = { ...theme, isActive: true, updatedAt: new Date().toISOString() };
    state.patch({
      themes: state.themes.map((item) => ({
        ...item,
        isActive: item.id === id,
        updatedAt: item.id === id ? new Date().toISOString() : item.updatedAt,
      })),
    });
    return updated;
  },

  async restoreDefaults(id: string): Promise<Theme> {
    await simulateLatency(240, 160);
    const state = useDataStore.getState();
    const original = SEED.themes.find((item) => item.id === id);
    if (!original) throw new MockApiError("Theme not found.", "not_found", 404);
    const restored: Theme = {
      ...original,
      settings: structuredClone(original.settings),
      updatedAt: new Date().toISOString(),
    };
    state.patch({
      themes: state.themes.map((item) => (item.id === id ? restored : item)),
    });
    return restored;
  },
};

export const pageService = {
  async list(): Promise<StorePage[]> {
    await simulateLatency(90, 90);
    return useDataStore.getState().pages;
  },
  async create(input: Omit<StorePage, "id" | "updatedAt">): Promise<StorePage> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.title.trim()) throw new MockApiError("Page title is required.", "validation");
    const page: StorePage = {
      ...input,
      id: `pag-${Date.now().toString(36)}`,
      slug: slugify(input.title),
      updatedAt: new Date().toISOString(),
    };
    state.patch({ pages: [...state.pages, page] });
    return page;
  },
  async update(id: string, input: Partial<StorePage>): Promise<StorePage> {
    await simulateLatency();
    const state = useDataStore.getState();
    const page = state.pages.find((item) => item.id === id);
    if (!page) throw new MockApiError("Page not found.", "not_found", 404);
    const updated: StorePage = {
      ...page,
      ...input,
      slug: input.title ? slugify(input.title) : page.slug,
      updatedAt: new Date().toISOString(),
    };
    state.patch({ pages: state.pages.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    state.patch({ pages: state.pages.filter((item) => item.id !== id) });
  },
};

export const blogService = {
  async list(): Promise<BlogPost[]> {
    await simulateLatency(90, 90);
    return useDataStore.getState().blogPosts;
  },
  async create(input: Omit<BlogPost, "id">): Promise<BlogPost> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.title.trim()) throw new MockApiError("Post title is required.", "validation");
    const post: BlogPost = {
      ...input,
      id: `blg-${Date.now().toString(36)}`,
      slug: slugify(input.title),
    };
    state.patch({ blogPosts: [post, ...state.blogPosts] });
    return post;
  },
  async update(id: string, input: Partial<BlogPost>): Promise<BlogPost> {
    await simulateLatency();
    const state = useDataStore.getState();
    const post = state.blogPosts.find((item) => item.id === id);
    if (!post) throw new MockApiError("Post not found.", "not_found", 404);
    const updated = {
      ...post,
      ...input,
      slug: input.title ? slugify(input.title) : post.slug,
    };
    state.patch({ blogPosts: state.blogPosts.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    state.patch({ blogPosts: state.blogPosts.filter((item) => item.id !== id) });
  },
};

export const navigationService = {
  async list(): Promise<NavMenu[]> {
    await simulateLatency(80, 80);
    return useDataStore.getState().navMenus;
  },
  async update(id: string, input: Partial<NavMenu>): Promise<NavMenu> {
    await simulateLatency();
    const state = useDataStore.getState();
    const menu = state.navMenus.find((item) => item.id === id);
    if (!menu) throw new MockApiError("Menu not found.", "not_found", 404);
    const updated = { ...menu, ...input };
    state.patch({ navMenus: state.navMenus.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async create(input: Omit<NavMenu, "id">): Promise<NavMenu> {
    await simulateLatency();
    const state = useDataStore.getState();
    const menu: NavMenu = { ...input, id: `nav-${Date.now().toString(36)}` };
    state.patch({ navMenus: [...state.navMenus, menu] });
    return menu;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    state.patch({ navMenus: state.navMenus.filter((item) => item.id !== id) });
  },
};

export const campaignService = {
  async list(): Promise<Campaign[]> {
    await simulateLatency(90, 90);
    return useDataStore.getState().campaigns;
  },
  async create(input: Omit<Campaign, "id">): Promise<Campaign> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.name.trim()) throw new MockApiError("Campaign name is required.", "validation");
    const campaign: Campaign = { ...input, id: `cmp-${Date.now().toString(36)}` };
    state.patch({ campaigns: [campaign, ...state.campaigns] });
    return campaign;
  },
  async update(id: string, input: Partial<Campaign>): Promise<Campaign> {
    await simulateLatency();
    const state = useDataStore.getState();
    const campaign = state.campaigns.find((item) => item.id === id);
    if (!campaign) throw new MockApiError("Campaign not found.", "not_found", 404);
    const updated = { ...campaign, ...input };
    state.patch({ campaigns: state.campaigns.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    state.patch({ campaigns: state.campaigns.filter((item) => item.id !== id) });
  },
};

export const integrationService = {
  async list(): Promise<Integration[]> {
    await simulateLatency(90, 90);
    return useDataStore.getState().integrations;
  },
  async connect(id: string): Promise<Integration> {
    await simulateLatency(320, 200);
    const state = useDataStore.getState();
    const integration = state.integrations.find((item) => item.id === id);
    if (!integration) throw new MockApiError("Integration not found.", "not_found", 404);
    const updated: Integration = { ...integration, status: "connected" };
    state.patch({
      integrations: state.integrations.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  },
  async disable(id: string): Promise<Integration> {
    await simulateLatency(220, 140);
    const state = useDataStore.getState();
    const integration = state.integrations.find((item) => item.id === id);
    if (!integration) throw new MockApiError("Integration not found.", "not_found", 404);
    const updated: Integration = { ...integration, status: "disabled" };
    state.patch({
      integrations: state.integrations.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  },
  async updateConfig(id: string, config: Integration["config"]): Promise<Integration> {
    await simulateLatency();
    const state = useDataStore.getState();
    const integration = state.integrations.find((item) => item.id === id);
    if (!integration) throw new MockApiError("Integration not found.", "not_found", 404);
    const updated: Integration = { ...integration, config };
    state.patch({
      integrations: state.integrations.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  },
};

/** Builds a WhatsApp click-to-chat link. Nothing is sent automatically. */
export function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}
