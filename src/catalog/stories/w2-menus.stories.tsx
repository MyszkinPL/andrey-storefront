import { useState } from 'react';
import {
  ClipboardPaste,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Globe,
  RefreshCw,
  Scissors,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuDestructiveItem,
  ContextMenuGroup,
  ContextMenuLinkItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSubmenu,
  Menubar,
  MenubarMenuButton,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarSeparator,
  NavigationMenuBar,
  Text,
} from '../../index';
import type { CatalogEntry } from '../types';

function ContextMenuStates() {
  const [notify, setNotify] = useState(true);
  const [theme, setTheme] = useState('system');
  const [archived, setArchived] = useState(false);
  return (
    <div className="seal-catalog-column">
      <ContextMenu
        trigger={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--seal-space-2)',
              padding: 'var(--seal-space-4)',
              border: '1px dashed var(--seal-border)',
              borderRadius: 'var(--seal-radius-lg)',
              color: 'var(--seal-text-muted)',
              fontSize: 'var(--seal-text-sm)',
              minWidth: 320,
            }}
          >
            <FileText size={16} aria-hidden />
            Правый клик по этой области
          </div>
        }
      >
        <ContextMenuGroup label="Clipboard">
          <ContextMenuItem>
            <Copy aria-hidden />
            Copy
          </ContextMenuItem>
          <ContextMenuItem>
            <Scissors aria-hidden />
            Cut
          </ContextMenuItem>
          <ContextMenuItem>
            <ClipboardPaste aria-hidden />
            Paste
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuSubmenu label="Export as">
          <ContextMenuItem>
            <Download aria-hidden />
            PDF
          </ContextMenuItem>
          <ContextMenuItem>
            <Download aria-hidden />
            PNG
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Share2 aria-hidden />
            Share link
          </ContextMenuItem>
        </ContextMenuSubmenu>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={notify} onCheckedChange={setNotify}>
          Notify customer
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
          Archived
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
          <ContextMenuRadioItem value="light">Light theme</ContextMenuRadioItem>
          <ContextMenuRadioItem value="dark">Dark theme</ContextMenuRadioItem>
          <ContextMenuRadioItem value="system">System theme</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuSeparator />
        <ContextMenuLinkItem href="#context-menu-docs">
          <Globe aria-hidden />
          Open docs →
        </ContextMenuLinkItem>
        <ContextMenuDestructiveItem>
          <Trash2 aria-hidden />
          Delete file
        </ContextMenuDestructiveItem>
      </ContextMenu>
      <Text size="xs" tone="muted">
        Notify: {String(notify)} · theme: {theme} · archived: {String(archived)} · клавиши Arrow/Enter/Esc, submenu открывается по
        стрелке вправо
      </Text>
    </div>
  );
}

function ContextMenuArrowStates() {
  return (
    <div className="seal-catalog-column">
      <ContextMenu
        arrow
        align="start"
        side="bottom"
        trigger={
          <div
            style={{
              padding: 'var(--seal-space-4)',
              border: '1px dashed var(--seal-border)',
              borderRadius: 'var(--seal-radius-lg)',
              color: 'var(--seal-text-muted)',
              fontSize: 'var(--seal-text-sm)',
              minWidth: 240,
            }}
          >
            Правый клик: панель со стрелкой
          </div>
        }
      >
        <ContextMenuItem>
          <Star aria-hidden />
          Add to favorites
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <RefreshCw aria-hidden />
          Resync (soon)
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Download aria-hidden />
          Download
        </ContextMenuItem>
      </ContextMenu>
      <Text size="xs" tone="muted">
        Стрелка позиционируется Base UI по стороне панели; disabled-пункт недоступен для клавиатуры
      </Text>
    </div>
  );
}

function MenubarStates() {
  const [wordWrap, setWordWrap] = useState(true);
  return (
    <div className="seal-catalog-column">
      <Menubar aria-label="Editor">
        <MenubarMenuButton label="File">
          <MenubarItem>
            <FileText aria-hidden />
            New file
          </MenubarItem>
          <MenubarItem>
            <FolderOpen aria-hidden />
            Open…
          </MenubarItem>
          <MenubarItem disabled>
            <Download aria-hidden />
            Export (Pro)
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem destructive>Delete project</MenubarItem>
        </MenubarMenuButton>
        <MenubarMenuButton label="Edit">
          <MenubarItem>
            <Copy aria-hidden />
            Copy
          </MenubarItem>
          <MenubarItem>
            <Scissors aria-hidden />
            Cut
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={wordWrap} onCheckedChange={() => setWordWrap((value) => !value)}>
            Word wrap
          </MenubarCheckboxItem>
        </MenubarMenuButton>
        <MenubarMenuButton label="View">
          <MenubarItem>Light theme</MenubarItem>
          <MenubarItem>Dark theme</MenubarItem>
          <MenubarItem disabled>System (locked)</MenubarItem>
        </MenubarMenuButton>
      </Menubar>
      <Text size="xs" tone="muted">
        Стрелки влево/вправо переключают меню в полосе, стрелки вверх/вниз — пункты; Word wrap: {String(wordWrap)}
      </Text>
    </div>
  );
}

function NavigationMenuStates() {
  return (
    <div className="seal-catalog-column">
      <NavigationMenuBar
        aria-label="Product"
        sections={[
          {
            label: 'Product',
            value: 'product',
            links: [
              { href: '#nav-overview', title: 'Overview', description: 'Что внутри и как это работает.' },
              { href: '#nav-pricing', title: 'Pricing', description: 'Тарифы, лимиты и биллинг.' },
              { href: '#nav-changelog', title: 'Changelog', description: 'Что вышло в последних релизах.' },
              { href: '#nav-docs', title: 'Documentation', description: 'Гайды и справочник API.' },
            ],
          },
          {
            label: 'Resources',
            value: 'resources',
            links: [
              { href: '#nav-guides', title: 'Guides', description: 'Пошаговые сценарии внедрения.' },
              { href: '#nav-support', title: 'Support', description: 'Ответы команды и сообщества.' },
            ],
          },
        ]}
        actions={
          <a className="seal-navigation-menu-trigger" href="#nav-github">
            GitHub
          </a>
        }
      />
      <Text size="xs" tone="muted">
        Панель — popover-поверхность Polar (radius-xl, тень md); иконка-каретка поворачивается через data-popup-open
      </Text>
    </div>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'ContextMenu',
    category: 'Actions',
    description: 'Base UI ContextMenu 1.8 — все части (group/checkbox/radio/submenu/link/destructive/arrow) в Polar dropdown-стиле.',
    variants: [
      { name: 'Right click, groups, submenu, radio', preview: <ContextMenuStates /> },
      { name: 'Arrow and disabled', preview: <ContextMenuArrowStates /> },
    ],
  },
  {
    name: 'Menubar',
    category: 'Navigation',
    description: 'Base UI Menubar 1.8 — полоса меню (File/Edit/View) на Menu-частях с Polar-стилем.',
    variants: [{ name: 'File, Edit, View', preview: <MenubarStates /> }],
  },
  {
    name: 'NavigationMenu',
    category: 'Navigation',
    description: 'Base UI NavigationMenu 1.8 — все части (List/Item/Trigger/Icon/Content/Link/Positioner/Popup/Arrow/Viewport) в Polar-стиле.',
    variants: [{ name: 'Sections with link cards', preview: <NavigationMenuStates /> }],
  },
];
