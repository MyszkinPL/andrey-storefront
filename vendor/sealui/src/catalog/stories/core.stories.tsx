import { Fragment, useState } from 'react';
import { ArrowLeft, Bold, Check, Inbox, Italic, Plus, Redo2, RefreshCw, Save, ShieldCheck, ShoppingCart, Trash2, Undo2, Underline as UnderlineIcon, X } from 'lucide-react';
import {
  Accordion,
  AlertDialog,
  Avatar,
  Banner,
  ButtonGroup,
  FilterPopover,
  Pill,
  Status,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  Combobox,
  Cluster,
  Container,
  DetailRow,
  Dialog,
  EmptyState,
  Field,
  Fieldset,
  Form,
  Heading,
  Input,
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuGroup,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MoneyInput,
  Paginator,
  Popover,
  PopoverDescription,
  PopoverTitle,
  Progress,
  Select,
  SelectParts,
  Separator,
  Setting,
  Stack,
  StatisticCard,
  Switch,
  Tabs,
  TabsPanel,
  RadioGroup,
  RadioItem,
  SegmentedControl,
  Text,
  Textarea,
  Timeline,
  Toggle,
  Toolbar,
  ToolbarButton,
  ToolbarInput,
  ToolbarLink,
  ToolbarGroup,
  ToolbarSeparator,
  Tooltip,
  Well,
  WellHeader,
  WellContent,
} from '../../index';
import type { CatalogEntry } from '../types';

const languages = [
  { id: 'ts', label: 'TypeScript' },
  { id: 'js', label: 'JavaScript' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'py', label: 'Python' },
];

function ButtonStates() {
  return <div className="seal-catalog-row"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button variant="outline">Outline</Button><Button variant="link">Link</Button><Button variant="underline">Underline</Button></div>;
}
function ButtonInteractionStates() {
  return <div className="seal-catalog-row"><Button disabled variant="secondary">Disabled</Button><Button disabled>Disabled primary</Button><Button loading variant="secondary">Loading</Button><Button loading icon={<RefreshCw />}>Processing</Button><Button focusableWhenDisabled disabled variant="secondary">Focusable when disabled</Button></div>;
}
function ButtonIconTextStates() {
  return <div className="seal-catalog-column"><div className="seal-catalog-row"><Button icon={<Plus />}>New product</Button><Button variant="secondary" icon={<ArrowLeft />}>Configure manually</Button><Button variant="secondary" icon={<RefreshCw />}>Refresh</Button></div><div className="seal-catalog-row"><Button variant="danger" icon={<Trash2 />}>Delete</Button><Button size="sm" variant="secondary" icon={<Save />}>Save</Button><Button size="lg" icon={<Plus />}>Create</Button></div></div>;
}
function ButtonSizes() {
  return <div className="seal-catalog-row"><Button size="sm">Small</Button><Button size="md">Medium</Button><Button size="lg">Large</Button><Button size="icon" variant="secondary" aria-label="Add item"><Plus aria-hidden /></Button><Button size="icon" variant="ghost" aria-label="Add item (ghost)"><Plus aria-hidden /></Button><Button size="icon" variant="outline" aria-label="Add item (outline)"><Plus aria-hidden /></Button></div>;
}
function ButtonFullWidth() {
  return <div className="seal-catalog-column" style={{ minWidth: 320 }}><Button fullWidth>Full width primary</Button><Button fullWidth variant="secondary">Full width secondary</Button></div>;
}
function ButtonGroupStates() {
  return <div className="seal-catalog-column"><div style={{ minWidth: 340 }}><ButtonGroup actions={[{ text: 'Save changes' }, { text: 'Preview' }]} /></div><div style={{ minWidth: 340 }}><ButtonGroup actions={[{ text: 'Pay $12.00', icon: <Plus /> }]} size="lg" /></div><ButtonGroup actions={[{ text: 'Continue', loading: true }, { text: 'Back' }]} size="sm" /><div style={{ minWidth: 340 }}><ButtonGroup align="end" actions={[{ text: 'Approve' }, { text: 'Decline', disabled: true }]} /></div></div>;
}
function FilterPopoverStates() {
  const [status, setStatus] = useState<string | null>('active');
  const [products, setProducts] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const productCatalog = ['Pro', 'Free', 'Team', 'Enterprise', 'Starter'];
  const filteredProducts = productCatalog
    .filter((label) => label.toLowerCase().includes(productQuery.toLowerCase()))
    .map((label) => ({ value: label.toLowerCase(), label }));
  return (
    <div className="seal-catalog-column">
      <div className="seal-catalog-row" style={{ alignItems: 'flex-start' }}>
        <FilterPopover
          label="Filters"
          filters={[
            { key: 'status', label: 'Status', type: 'single', value: status, defaultValue: 'active', onChange: setStatus, options: [{ value: 'active', label: 'Active' }, { value: 'trialing', label: 'Trialing' }, { value: 'canceled', label: 'Canceled' }, { value: 'past_due', label: 'Past due' }] },
            {
              key: 'product',
              label: 'Product',
              type: 'multi',
              value: products,
              onChange: setProducts,
              searchQuery: productQuery,
              onSearchQueryChange: setProductQuery,
              searchPlaceholder: 'Search products…',
              options: filteredProducts,
            },
          ]}
        />
        <Text size="xs" tone="muted">
          Статус: {status ?? '—'}; продукты: {products.length ? products.join(', ') : '—'}
        </Text>
      </div>
      <Text size="xs" tone="muted">Триггер: бейдж = активные фильтры (дефолт «active» не считается). Внутри: сводка справа, опции с Check, Clear filters. Product: лупа раскрывает поиск (кроссфейд с лейблом), Backspace возвращается к списку.</Text>
    </div>
  );
}
function PopoverStates() {
  return (
    <div className="seal-catalog-row" style={{ alignItems: 'flex-start' }}>
      <Popover trigger={<Button variant="secondary">Bottom + title</Button>}>
        <PopoverTitle>Quick actions</PopoverTitle>
        <PopoverDescription>Закрывается по Esc и клику вне панели.</PopoverDescription>
      </Popover>
      <Popover trigger={<Button variant="secondary">Top end arrow</Button>} side="top" align="end" arrow>
        Панель со стороны top, выравнивание по правому краю.
      </Popover>
    </div>
  );
}
function TimelineStates() {
  const now = Date.now();
  const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  return (
    <div className="seal-catalog-column">
      <Timeline
        items={[
          { id: '1', timestamp: iso(0), title: 'Payment received', summary: 'Order #1042 · $29.00', icon: <Check size={16} />, sentiment: 'neutral' },
          { id: '2', timestamp: iso(12), title: 'Checkout opened', icon: <ShoppingCart size={16} /> },
          { id: '3', timestamp: iso(47), title: 'Product page viewed', icon: <Inbox size={16} /> },
          { id: '4', timestamp: iso(180), title: 'Payment failed', summary: 'Card declined · retry available', icon: <X size={16} />, sentiment: 'negative' },
          { id: '5', timestamp: iso(1560), title: 'Subscription updated', summary: 'Pro → Team · 3 seats', icon: <RefreshCw size={16} /> },
        ]}
      />
      <Text size="xs" tone="muted">Мелкие события подряд (без summary) сворачиваются в «N collapsed events» — раскрой стрелкой; negative красит круг.</Text>
    </div>
  );
}
function MoneyInputStates() {
  const [usd, setUsd] = useState<number | null>(1990);
  const [jpy, setJpy] = useState<number | null>(null);
  return (
    <div className="seal-catalog-column">
      <MoneyInput currency="usd" value={usd} onChange={setUsd} placeholder={1990} aria-label="USD amount" />
      <MoneyInput currency="jpy" value={jpy} onChange={setJpy} placeholder={1000} aria-label="JPY amount" />
      <Text size="xs" tone="muted">USD: {usd === null ? 'null' : usd} (минорные) · JPY целые: {jpy === null ? 'null' : jpy} · ArrowUp/Down шагают на 0.10, запятая = точка</Text>
      <MoneyInput currency="usd" value={null} onChange={() => undefined} disabled placeholder={500} aria-label="Disabled USD" />
    </div>
  );
}
function ProgressStates() {
  return (
    <div className="seal-catalog-column">
      <Progress value={0} />
      <Progress value={45} showValue />
      <Progress value={100} />
      <Progress label="Uploading art-card.png" value={64} showValue />
      <Progress aria-label="Indeterminate load" />
    </div>
  );
}
function RadioGroupStates() {
  const [plan, setPlan] = useState('pro');
  return (
    <div className="seal-catalog-column">
      <RadioGroup value={plan} onValueChange={setPlan} name="donation-plan">
        <RadioItem value="free" label="Free" />
        <RadioItem value="pro" label="Pro" />
        <RadioItem value="team" label="Team" />
        <RadioItem value="enterprise" label="Enterprise" disabled />
      </RadioGroup>
      <Text size="xs" tone="muted">Выбрано: {plan} · Polar-точный: 16px кружок, border-accent, точка-Circle 10px, grid gap-2</Text>
    </div>
  );
}
function SegmentedControlStates() {
  const [range, setRange] = useState('30d');
  const [view, setView] = useState('chart');
  return (
    <div className="seal-catalog-column">
      <SegmentedControl
        aria-label="Date range"
        options={[{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }]}
        value={range}
        onValueChange={setRange}
      />
      <SegmentedControl
        aria-label="Date range sizes"
        size="lg"
        options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]}
        value={view === 'chart' ? 'a' : 'b'}
        onValueChange={() => undefined}
      />
      <SegmentedControl
        aria-label="View switch"
        variant="tabs"
        options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }, { value: 'insights', label: 'Insights' }]}
        value={view}
        onValueChange={setView}
      />
      <Text size="xs" tone="muted">Range: {range} · View: {view} · клавиатура — стрелки (Base UI roving focus)</Text>
    </div>
  );
}
function ToggleStates() {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="seal-catalog-column">
      <div className="seal-catalog-row">
        <Toggle pressed={pressed} onPressedChange={setPressed} aria-label="Strike bold">
          <Bold aria-hidden />
        </Toggle>
        <Toggle defaultPressed aria-label="Italic"><Italic aria-hidden /></Toggle>
        <Toggle disabled aria-label="Disabled"><UnderlineIcon aria-hidden /></Toggle>
      </div>
      <Text size="xs" tone="muted">pressed: {String(pressed)}</Text>
    </div>
  );
}
function MenuStates() {
  const [detached, setDetached] = useState(false);
  const [kind, setKind] = useState('public');
  return (
    <div className="seal-catalog-column">
      <Menu trigger={<Button variant="secondary" icon={<ArrowLeft />}>Order actions</Button>} aria-label="Order actions">
        <MenuGroup label="Order #1042">
          <MenuItem>Retry payment</MenuItem>
          <MenuItem disabled>Resend invoice</MenuItem>
          <MenuItem destructive>Refund customer</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem checked={!detached} onCheckedChange={setDetached}>
          Notify customer
        </MenuCheckboxItem>
        <MenuLinkItem href="#">Open in docs →</MenuLinkItem>
      </Menu>
      <Menu trigger={<Button variant="secondary">Radio menu</Button>} aria-label="Visibility">
        <MenuGroup label="Visibility">
          <MenuRadioGroup value={kind} onValueChange={setKind}>
            <MenuRadioItem value="public">Public</MenuRadioItem>
            <MenuRadioItem value="unlisted">Unlisted</MenuRadioItem>
            <MenuRadioItem value="private">Private</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
      </Menu>
      <Text size="xs" tone="muted">Notify: {String(detached)} · видимость: {kind} · клавиши: Arrow/Enter/Esc (Base UI)</Text>
    </div>
  );
}
function ToolbarStates() {
  return (
    <div className="seal-catalog-column">
      <Toolbar>
        <ToolbarGroup aria-label="Text style">
          <ToolbarButton variant="ghost" aria-pressed aria-label="Bold"><Bold aria-hidden /></ToolbarButton>
          <ToolbarButton variant="ghost" aria-label="Italic"><Italic aria-hidden /></ToolbarButton>
          <ToolbarButton variant="ghost" aria-label="Underline"><UnderlineIcon aria-hidden /></ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup aria-label="History">
          <ToolbarButton variant="ghost" disabled aria-label="Undo"><Undo2 aria-hidden /></ToolbarButton>
          <ToolbarButton variant="ghost" aria-label="Redo"><Redo2 aria-hidden /></ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarButton variant="secondary" icon={<Plus />} aria-label="Insert">Insert</ToolbarButton>
        <ToolbarInput placeholder="Search…" aria-label="Search in toolbar" />
        <ToolbarButton variant="secondary" aria-label="Submit search">Go</ToolbarButton>
        <ToolbarLink href="#">Docs</ToolbarLink>
      </Toolbar>
      <div style={{ maxWidth: 360 }}>
        <Toolbar>
          <ToolbarButton variant="secondary">Narrow container: items wrap to a second row</ToolbarButton>
          <ToolbarButton variant="ghost" icon={<Plus />} aria-label="Add">Add</ToolbarButton>
          <ToolbarButton variant="ghost" icon={<RefreshCw />} aria-label="Refresh">Refresh</ToolbarButton>
        </Toolbar>
      </div>
      <div style={{ display: 'flex', gap: 'var(--seal-space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Toolbar orientation="vertical" aria-label="Vertical toolbar">
          <ToolbarButton variant="ghost" aria-pressed aria-label="Bold"><Bold aria-hidden /></ToolbarButton>
          <ToolbarButton variant="ghost" aria-label="Italic"><Italic aria-hidden /></ToolbarButton>
          <ToolbarButton variant="ghost" aria-label="Underline"><UnderlineIcon aria-hidden /></ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton variant="ghost" disabled aria-label="Undo"><Undo2 aria-hidden /></ToolbarButton>
        </Toolbar>
        <Text size="xs" tone="muted">Стрелки — клавиатурная навигация Base UI; wrap на узких контейнерах; вертикальный режим без переноса</Text>
      </div>
    </div>
  );
}
function PillStates() {
  return <div className="seal-catalog-row"><Pill color="gray">Gray</Pill><Pill color="blue">Blue</Pill><Pill color="purple">Purple</Pill><Pill color="yellow">Yellow</Pill><Pill color="red">Red</Pill><Pill color="green">Green</Pill></div>;
}
function StatusStates() {
  return <div className="seal-catalog-column"><div className="seal-catalog-row"><Status status="No color" /><Status status="Small gray" color="gray" size="small" /><Status status="Medium green" color="green" /><Status status="Warning" color="yellow" /></div><div className="seal-catalog-row"><Status status="Red" color="red" /><Status status="Blue" color="blue" /><Status status="Purple" color="purple" /></div></div>;
}
function AvatarStates() {
  return <div className="seal-catalog-row"><Avatar name="S M" size="sm" /><Avatar name="Maria Dev" /><Avatar name="Large User" size="lg" /><Avatar name="Sample profile" src="https://i.pravatar.cc/96?img=12" size="lg" /></div>;
}
function AvatarNameStates() {
  return <div className="seal-catalog-row"><Avatar name="john@polar.sh" /><Avatar name="ada lovelace" /><Avatar name="Cher" /><Avatar name="Тест Пользователь" /></div>;
}
function AvatarLoadStates() {
  return <div className="seal-catalog-row"><Avatar name="Broken image" src="https://broken.invalid/avatar.png" size="lg" /><Avatar name="Null url" src={null} size="lg" /><Avatar name="Custom fallback" src="https://broken.invalid/x.png" fallback="VK" size="lg" /></div>;
}
function CheckboxStates() {
  // Подпись — проп компонента (`Checkbox label`), а не самодельный <label> вокруг него.
  return <div className="seal-catalog-column"><Checkbox label="Unchecked" /><Checkbox defaultChecked label="Checked" /><Checkbox indeterminate label="Indeterminate" /><Checkbox disabled label="Disabled" /></div>;
}
function SwitchStates() {
  return <div className="seal-catalog-row"><Switch /><Switch defaultChecked /><Switch disabled /><Switch defaultChecked disabled /></div>;
}
function InputStates() {
  return <div className="seal-catalog-column"><Input placeholder="Default input" /><Input defaultValue="Filled value" /><Input disabled placeholder="Disabled" /><Textarea placeholder="Textarea" rows={3} /></div>;
}
function SeparatorStates() {
  return (
    <div className="seal-catalog-column">
      <Text size="sm">Content above</Text>
      <Separator />
      <Text size="sm">Content below</Text>
      <div className="seal-catalog-row seal-separator-demo-row">
        <Text size="sm">Horizontal group</Text>
        <Separator orientation="vertical" />
        <Text size="sm">Vertical divider</Text>
      </div>
    </div>
  );
}
function SelectStates() {
  return <Select options={[{ value: 'ru', label: 'Россия' }, { value: 'us', label: 'United States' }, { value: 'jp', label: 'Japan' }, { value: 'locked', label: 'Unavailable', disabled: true }]} defaultValue="ru" placeholder="Choose a country" name="country" required />;
}
function SelectFieldStates() {
  return <div className="seal-catalog-column"><label className="seal-select-label" htmlFor="readonly-region">Read-only select</label><Select id="readonly-region" options={[{ value: 'eu', label: 'Europe' }, { value: 'na', label: 'North America' }]} defaultValue="eu" readOnly /><label className="seal-select-label" htmlFor="disabled-region">Disabled select</label><Select id="disabled-region" options={[{ value: 'eu', label: 'Europe' }]} defaultValue="eu" disabled /></div>;
}
const regionGroups = [
  { label: 'Americas', items: [{ value: 'us', label: 'United States' }, { value: 'ca', label: 'Canada' }] },
  { label: 'Europe', items: [{ value: 'uk', label: 'United Kingdom' }, { value: 'de', label: 'Germany' }] },
];

function SelectGroupedStates() {
  return (
    <SelectParts.Root items={regionGroups} defaultValue="us">
      <SelectParts.Label>Region</SelectParts.Label>
      <SelectParts.Trigger>
        <SelectParts.Value placeholder="Choose a region" />
        <SelectParts.Icon />
      </SelectParts.Trigger>
      <SelectParts.Portal>
        <SelectParts.Positioner>
          <SelectParts.Popup>
            <SelectParts.ScrollUpArrow />
            <SelectParts.List>
              {regionGroups.map((group, index) => (
                <Fragment key={group.label}>
                  {index > 0 ? <SelectParts.Separator /> : null}
                  <SelectParts.Group>
                    <SelectParts.GroupLabel>{group.label}</SelectParts.GroupLabel>
                    {group.items.map((item) => (
                      <SelectParts.Item key={item.value} value={item.value}>
                        <SelectParts.ItemIndicator />
                        <SelectParts.ItemText>{item.label}</SelectParts.ItemText>
                      </SelectParts.Item>
                    ))}
                  </SelectParts.Group>
                </Fragment>
              ))}
            </SelectParts.List>
            <SelectParts.ScrollDownArrow />
          </SelectParts.Popup>
        </SelectParts.Positioner>
      </SelectParts.Portal>
    </SelectParts.Root>
  );
}
const channelItems = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push notifications' },
];

function SelectMultipleStates() {
  const [value, setValue] = useState<string[]>(['email', 'push']);
  return (
    <SelectParts.Root<string, true> items={channelItems} multiple value={value} onValueChange={(nextValue) => setValue(nextValue)}>
      <SelectParts.Label>Notification channels</SelectParts.Label>
      <SelectParts.Trigger>
        <SelectParts.Value placeholder="Choose channels" />
        <SelectParts.Icon />
      </SelectParts.Trigger>
      <SelectParts.Portal>
        <SelectParts.Positioner>
          <SelectParts.Popup>
            <SelectParts.List>
              {channelItems.map((item) => (
                <SelectParts.Item key={item.value} value={item.value}>
                  <SelectParts.ItemIndicator />
                  <SelectParts.ItemText>{item.label}</SelectParts.ItemText>
                </SelectParts.Item>
              ))}
            </SelectParts.List>
          </SelectParts.Popup>
        </SelectParts.Positioner>
      </SelectParts.Portal>
    </SelectParts.Root>
  );
}
const intervalItems = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function SelectControlledOpenStates() {
  const [open, setOpen] = useState(false);
  return (
    <div className="seal-catalog-column">
      <SelectParts.Root items={intervalItems} open={open} onOpenChange={setOpen} defaultValue="weekly" modal={false} highlightItemOnHover={false}>
        <SelectParts.Label>Billing interval</SelectParts.Label>
        <SelectParts.Trigger>
          <SelectParts.Value>{(value) => intervalItems.find((item) => item.value === value)?.label ?? 'Choose interval'}</SelectParts.Value>
          <SelectParts.Icon />
        </SelectParts.Trigger>
        <SelectParts.Portal>
          <SelectParts.Positioner side="bottom" align="start" sideOffset={8} alignItemWithTrigger={false}>
            <SelectParts.Popup>
              <SelectParts.Arrow />
              <SelectParts.List>
                {intervalItems.map((item) => (
                  <SelectParts.Item key={item.value} value={item.value} label={item.label}>
                    <SelectParts.ItemIndicator keepMounted />
                    <SelectParts.ItemText>{item.label}</SelectParts.ItemText>
                  </SelectParts.Item>
                ))}
              </SelectParts.List>
            </SelectParts.Popup>
          </SelectParts.Positioner>
        </SelectParts.Portal>
      </SelectParts.Root>
      <Text size="xs" tone="muted">Popup is {open ? 'open' : 'closed'} (controlled); modal off; hover highlight off</Text>
    </div>
  );
}
function SelectFormStates() {
  const [submitted, setSubmitted] = useState('Not submitted');
  return <form className="seal-catalog-column" onSubmit={(event) => { event.preventDefault(); setSubmitted(new FormData(event.currentTarget).get('timezone')?.toString() ?? 'Missing value'); }}><label className="seal-select-label" htmlFor="timezone">Required timezone (native form value)</label><Select id="timezone" name="timezone" autoComplete="off" options={[{ value: 'utc', label: 'UTC' }, { value: 'pst', label: 'Pacific Time' }]} defaultValue="utc" required /><Button type="submit">Submit</Button><Text size="xs" tone="muted">Form result: {submitted}</Text></form>;
}
function ComboboxSingle() {
  const [value, setValue] = useState<string | null>('ts');
  const [query, setQuery] = useState('');
  return <div className="seal-catalog-column"><Combobox items={languages} value={value} selectedItem={languages.find((item) => item.id === value) ?? null} onChange={setValue} onQueryChange={setQuery} getItemValue={(item) => item.id} getItemLabel={(item) => item.label} label="Programming language" placeholder="Select a language" searchPlaceholder="Search languages…" emptyLabel="No languages found" /><Text size="xs" tone="muted">Query: {query || '—'}</Text></div>;
}
function ComboboxDisabledItems() {
  const items = [...languages.slice(0, 2), { id: 'locked', label: 'Unavailable option' }, ...languages.slice(2)];
  const [value, setValue] = useState<string | null>(null);
  return <Combobox items={items} value={value} selectedItem={items.find((item) => item.id === value) ?? null} onChange={setValue} onQueryChange={() => undefined} getItemValue={(item) => item.id} getItemLabel={(item) => item.label} isItemDisabled={(item) => item.id === 'locked'} label="Disabled item state" placeholder="Choose an available option" />;
}
function CheckboxGroupStates() {
  const [value, setValue] = useState<string[]>(['read']);
  return <CheckboxGroup allLabel="Select all" options={[{ value: 'read', label: 'Read access' }, { value: 'write', label: 'Write access' }, { label: 'Administration', children: [{ value: 'invite', label: 'Invite members' }, { value: 'billing', label: 'Manage billing' }] }]} value={value} onValueChange={setValue} />;
}
function AccordionStates() {
  return <Accordion items={[{ title: 'Billing settings', content: 'Payment methods, invoices and billing details.' }, { title: 'Security', content: 'Authentication and account security options.' }]} />;
}
function CollapsibleStates() {
  return <Collapsible trigger="Advanced options">Additional controls are grouped inside this collapsible panel.</Collapsible>;
}
function TabsStates() {
  return <Tabs items={[{ value: 'profile', label: 'Profile' }, { value: 'security', label: 'Security' }]} defaultValue="profile"><TabsPanel value="profile"><Text size="sm">Profile tab content</Text></TabsPanel><TabsPanel value="security"><Text size="sm">Security tab content</Text></TabsPanel></Tabs>;
}
function DialogStates() {
  return <Dialog trigger={<Button variant="secondary">Open dialog</Button>} title="Edit profile" description="Update your account details."><div className="seal-catalog-row"><Button variant="secondary">Cancel</Button><Button>Save changes</Button></div></Dialog>;
}
function AlertDialogStates() {
  return <AlertDialog trigger={<Button variant="danger">Delete item</Button>} title="Delete this item?" description="This action cannot be undone."><Button variant="danger">Delete</Button></AlertDialog>;
}
function TooltipStates() {
  return <Tooltip content="Tooltip content"><Button variant="secondary">Hover or focus</Button></Tooltip>;
}
function FieldStates() {
  return <div className="seal-catalog-column"><Field label="Email" description="Used for account notifications."><Input type="email" placeholder="you@example.com" /></Field><Field label="Invalid field" error="Enter a valid value."><Input type="email" defaultValue="bad" /></Field></div>;
}
function FieldsetStates() {
  return <Fieldset legend="Personal information"><Field label="Name"><Input placeholder="Full name" /></Field></Fieldset>;
}
function FormStates() {
  const [message, setMessage] = useState('');
  return <Form onSubmit={(values) => setMessage(JSON.stringify(values))}><Field label="Workspace name"><Input name="workspace" defaultValue="My workspace" /></Field><Button type="submit">Submit form</Button>{message ? <Text size="xs" tone="muted">{message}</Text> : null}</Form>;
}
function CardStates() {
  return <Card><Setting title="Email notifications" description="Receive important billing updates."><Switch defaultChecked /></Setting><Setting title="Usage summary" description="Show usage in the customer portal."><Switch /></Setting></Card>;
}
function CardLayoutStates() {
  return <div className="seal-catalog-column"><Card><Setting title="Split layout (default)" description="Label and control on opposite sides on md+."><Switch defaultChecked /></Setting><Setting title="Inline layout" description="Tighter row gap, control stays beside the label." layout="inline"><Switch /></Setting><Setting title="Stacked layout" description="Control flows under the label, full width." layout="stacked"><Switch defaultChecked /></Setting></Card></div>;
}
function CardPlainStates() {
  return <div className="seal-catalog-row" style={{ width: '100%' }}><Card><div style={{ padding: 'var(--seal-space-4)' }}><Heading size="sm">Plain card</Heading><Text size="sm" tone="muted">Polar ring + rounded-2xl container without setting rows.</Text></div></Card></div>;
}
function TextStates() {
  return <div className="seal-catalog-column"><Heading size="lg">Page heading</Heading><Heading size="md">Section heading</Heading><Heading size="sm">Subsection heading</Heading><div className="seal-catalog-row"><Text size="sm">Default</Text><Text size="sm" tone="secondary">Secondary</Text><Text size="sm" tone="muted">Muted</Text><Text size="sm" tone="accent">Accent</Text><Text size="sm" tone="warning">Warning</Text><Text size="sm" tone="success">Success</Text><Text size="sm" tone="danger">Danger</Text></div><div className="seal-catalog-row"><Text size="xs">xs 12px</Text><Text size="sm">sm 14px</Text><Text size="md">md 16px</Text><Text size="lg">lg 18px</Text></div></div>;
}
function LayoutStates() {
  return <Stack gap="3"><Text size="xs" tone="muted">Stack / Cluster / Container</Text><Cluster gap="2"><Pill color="gray">Cluster item</Pill><Pill color="blue">Polar blue</Pill></Cluster><Container width="sm"><Card><Setting title="Container sm (640px)" description="Preset width; no custom pixels."><Switch defaultChecked /></Setting></Card></Container></Stack>;
}
function StackGapStates() {
  return <div className="seal-catalog-column"><div><Text size="xs" tone="muted">gap 1 = 4px</Text><Stack gap="1" align="start"><Pill color="gray">Alpha</Pill><Pill color="gray">Beta</Pill><Pill color="gray">Gamma</Pill></Stack></div><div><Text size="xs" tone="muted">gap 3 = 12px</Text><Stack gap="3" align="start"><Pill color="gray">Alpha</Pill><Pill color="gray">Beta</Pill><Pill color="gray">Gamma</Pill></Stack></div><div><Text size="xs" tone="muted">gap 8 = 32px</Text><Stack gap="8" align="start"><Pill color="gray">Alpha</Pill><Pill color="gray">Beta</Pill><Pill color="gray">Gamma</Pill></Stack></div></div>;
}
function ClusterAlignStates() {
  return <div className="seal-catalog-column"><div><Text size="xs" tone="muted">Wrap (перенос на новую строку)</Text><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)' }}><Cluster gap="2"><Pill color="gray">One</Pill><Pill color="blue">Two</Pill><Pill color="purple">Three</Pill><Pill color="red">Four</Pill><Pill color="green">Five</Pill><Pill color="yellow">Six</Pill><Pill color="gray">Seven</Pill><Pill color="blue">Eight</Pill></Cluster></div></div><div><Text size="xs" tone="muted">justify end (прижато вправо)</Text><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)' }}><Cluster gap="2" justify="end"><Pill color="gray">justify end</Pill><Pill color="blue">right side</Pill></Cluster></div></div><div><Text size="xs" tone="muted">justify between (по краям)</Text><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)' }}><Cluster gap="2" justify="between"><Pill color="gray">left</Pill><Pill color="blue">right</Pill></Cluster></div></div><div><Text size="xs" tone="muted">align end (вертикально вниз)</Text><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)' }}><Cluster gap="2" align="end"><Pill color="gray">small</Pill><Button size="sm" variant="secondary">Taller element</Button></Cluster></div></div></div>;
}
function ContainerWidthStates() {
  return <div className="seal-catalog-column"><Container width="sm"><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)', textAlign: 'center' }}>sm 640</div></Container><Container width="md"><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)', textAlign: 'center' }}>md 768</div></Container><Container width="lg"><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)', textAlign: 'center' }}>lg 1024</div></Container><Container width="full"><div style={{ border: '1px dashed var(--seal-border)', padding: 'var(--seal-space-2)', textAlign: 'center' }}>full</div></Container></div>;
}
function BannerVariants() {
  return <div className="seal-catalog-column"><Banner variant="info" title="Subscription renews on Nov 1" description="Your next invoice will be issued automatically." /><Banner variant="success" title="Payout scheduled" description="Your balance will be transferred within 3 business days." /><Banner variant="warning" title="Your organization is being offboarded" description="Some features may be limited. Reach out if you have any questions." /><Banner variant="danger" title="Payments are unavailable for your organization" description="Your organization has been denied access to payments." /></div>;
}
function BannerInteractions() {
  const [dismissed, setDismissed] = useState(false);
  return <div className="seal-catalog-column"><Banner variant="danger" title="You have a dispute that needs a response" description="A customer disputed a payment. Submit evidence before the deadline to contest it." actions={[{ label: 'Review dispute' }, { label: 'Later', variant: 'ghost' }]} onDismiss={() => setDismissed(true)} /><Banner variant="info" title="Loading billing status…" loading description="Checking your payment method." /><Text size="xs" tone="muted">Dismissed: {String(dismissed)}</Text></div>;
}
function WellCompositions() {
  return <div className="seal-catalog-column"><Well><WellHeader title="Payment Methods" description="Methods used for subscriptions & one-time purchases" action={<Button size="sm">Add Payment Method</Button>} /><WellContent><DetailRow label="Visa •••• 4242" value="Expires 04/28" /><DetailRow label="Default" value="Yes" /></WellContent></Well><Well><WellHeader title="Privacy" description="Download a copy of all your personal data" action={<Button size="sm" variant="secondary">Export Data</Button>} /></Well></div>;
}
function DetailRowStates() {
  return <div className="seal-catalog-column"><div style={{ minWidth: 360 }}><DetailRow label="Email" value="jane@example.com" /><DetailRow label="Customer ID" value="cus_2fA9xKpQ7" mono /><DetailRow label="External ID" /><DetailRow label="Invoice number" value="INV-2026-0007" action={<Button size="sm" variant="ghost">Copy</Button>} /></div><Text size="xs" tone="muted">Наведи на строку: значение получает подложку, действие появляется справа.</Text></div>;
}
function EmptyStateStates() {
  return <div className="seal-catalog-column"><EmptyState icon={<ShieldCheck />} title="Nothing at risk" description="No payment issues or scheduled cancellations." /><EmptyState icon={<Inbox />} title="No results" description="Try adjusting your filters." actions={[{ label: 'Clear filters', variant: 'secondary' }]} /><EmptyState icon={<ShoppingCart />} title="No orders yet" description="Orders will appear here after the first sale." actions={[{ label: 'Create product' }, { label: 'Docs', variant: 'ghost' }]} fill /></div>;
}
function StatisticCardStates() {
  return <div className="seal-catalog-column"><div className="seal-catalog-row"><StatisticCard title="Revenue">$12,345.67</StatisticCard><StatisticCard title="Orders">1 284</StatisticCard><StatisticCard title="Churn">0.8%</StatisticCard></div><div className="seal-catalog-row"><StatisticCard title="Monthly recurring revenue" size="lg">$12,345.67</StatisticCard><StatisticCard title="Active subscriptions" size="lg">3 921</StatisticCard></div></div>;
}
function PaginatorStates() {
  const [page, setPage] = useState(3);
  return <div className="seal-catalog-column"><Text size="xs" tone="muted">27 страниц, siblingCount 1, текущая {page}</Text><Paginator totalCount={270} pageSize={10} currentPage={page} onPageChange={setPage} /><Text size="xs" tone="muted">Мало страниц — диапазон без точек</Text><Paginator totalCount={40} pageSize={10} currentPage={2} onPageChange={() => {}} /></div>;
}

export const entries: CatalogEntry[] = [
  { name: 'Button', category: 'Actions', description: 'Polar orbit Button: full variant set on Base UI, icon+text pairs, loading and focusableWhenDisabled.', variants: [{ name: 'Variants', preview: <ButtonStates /> }, { name: 'Icon and text', preview: <ButtonIconTextStates /> }, { name: 'Disabled, loading, focusable', preview: <ButtonInteractionStates /> }, { name: 'Sizes and icon-only', preview: <ButtonSizes /> }, { name: 'Full width', preview: <ButtonFullWidth /> }] },
  { name: 'ButtonGroup', category: 'Actions', description: 'Polar CTA pair: primary + ghost, icons, align end, wrap on narrow screens.', variants: [{ name: 'Sizes, icons, align', preview: <ButtonGroupStates /> }] },
  { name: 'Toolbar', category: 'Actions', description: 'Base UI Toolbar in Polar styling: icon buttons, groups, input, link, separators; wrap and vertical orientation.', variants: [{ name: 'Horizontal, wrap, vertical', preview: <ToolbarStates /> }] },
  { name: 'FilterPopover', category: 'Actions', description: 'Polar filter menu: badge, summaries, nested options, clear all; searchable product filter with crossfade.', variants: [{ name: 'Single, multi and search', preview: <FilterPopoverStates /> }] },
  { name: 'Timeline', category: 'Data display', description: 'Polar event timeline: 32px icon circles, relative time, collapsed-event folds.', variants: [{ name: 'Events and folds', preview: <TimelineStates /> }] },
  { name: 'MoneyInput', category: 'Forms', description: 'Polar money field: minor units, currency slot, ArrowUp/Down stepping, comma tolerance.', variants: [{ name: 'Currencies and states', preview: <MoneyInputStates /> }] },
  { name: 'Progress', category: 'Feedback', description: 'Polar progress bar: h-2 track, blue fill, label/value slots, indeterminate.', variants: [{ name: 'Values and label', preview: <ProgressStates /> }] },
  { name: 'RadioGroup', category: 'Forms', description: 'Polar radio group: 16px accent circle, 10px dot fill, grid gap-2.', variants: [{ name: 'Choices', preview: <RadioGroupStates /> }] },
  { name: 'Menu', category: 'Actions', description: 'Polar dropdown menu on Base UI Menu: groups, item/link/checkbox/radio items, destructive, keyboard.', variants: [{ name: 'Actions and radio', preview: <MenuStates /> }] },
  { name: 'SegmentedControl / Toggle', category: 'Actions', description: 'Polar SegmentedControl (capsule, tabs variant) on Base UI ToggleGroup + single Toggle.', variants: [{ name: 'Sizes, tabs, toggle', preview: <SegmentedControlStates /> }, { name: 'Single toggles', preview: <ToggleStates /> }] },
  { name: 'Popover', category: 'Feedback', description: 'Base UI popover positioned to trigger, Esc/outside click close, optional arrow.', variants: [{ name: 'Sides, arrow, title', preview: <PopoverStates /> }] },
  { name: 'Pill / Status', category: 'Data display', description: 'Polar Pill and Status components with their original color and size presets.', variants: [{ name: 'Pill colors (Polar)', preview: <PillStates /> }, { name: 'Status colors and sizes (Polar)', preview: <StatusStates /> }] },
  { name: 'Avatar', category: 'Data display', description: 'Polar Orbit avatar: sizes 24/32/48, initials from name or e-mail, image load/error fallbacks.', variants: [{ name: 'Sizes and image', preview: <AvatarStates /> }, { name: 'Name and e-mail initials', preview: <AvatarNameStates /> }, { name: 'Broken image, null URL, custom fallback', preview: <AvatarLoadStates /> }] },
  { name: 'Text and Heading', category: 'Data display', description: 'Typography scale and semantic tones.', variants: [{ name: 'Scale and tones', preview: <TextStates /> }] },
  { name: 'Input and Textarea', category: 'Forms', description: 'Text entry controls.', variants: [{ name: 'States', preview: <InputStates /> }] },
  { name: 'Separator', category: 'Layout', description: 'Accessible horizontal and vertical content divider.', variants: [{ name: 'Orientations', preview: <SeparatorStates /> }] },
  { name: 'Select', category: 'Forms', description: 'All 19 Base UI 1.8 Select parts, root/value/open/form APIs and positioning props, with Polar styling.', variants: [{ name: 'Options shortcut, name and required', preview: <SelectStates /> }, { name: 'Disabled and read-only', preview: <SelectFieldStates /> }, { name: 'Groups and separators', preview: <SelectGroupedStates /> }, { name: 'Multiple selection', preview: <SelectMultipleStates /> }, { name: 'Controlled popup, custom value, position and arrow', preview: <SelectControlledOpenStates /> }, { name: 'Native form submission', preview: <SelectFormStates /> }] },
  { name: 'Combobox', category: 'Forms', description: 'Polar-style searchable selector powered by Base UI Combobox.', variants: [{ name: 'Single selection', preview: <ComboboxSingle /> }, { name: 'Disabled option', preview: <ComboboxDisabledItems /> }] },
  { name: 'Checkbox', category: 'Forms', description: 'Checked, unchecked, indeterminate and disabled states.', variants: [{ name: 'States', preview: <CheckboxStates /> }] },
  { name: 'CheckboxGroup', category: 'Forms', description: 'Grouped access settings with select-all and nested parent behavior.', variants: [{ name: 'Flat and nested groups', preview: <CheckboxGroupStates /> }] },
  { name: 'Switch', category: 'Forms', description: 'Polar-sized on/off control.', variants: [{ name: 'States', preview: <SwitchStates /> }] },
  { name: 'Field', category: 'Forms', description: 'Label, description and validation message composition.', variants: [{ name: 'Default and error', preview: <FieldStates /> }] },
  { name: 'Fieldset', category: 'Forms', description: 'Semantic grouping of related form controls.', variants: [{ name: 'With legend', preview: <FieldsetStates /> }] },
  { name: 'Form', category: 'Forms', description: 'Base UI form validation and submission.', variants: [{ name: 'Submit values', preview: <FormStates /> }] },
  { name: 'Accordion', category: 'Disclosure', description: 'Expandable content sections.', variants: [{ name: 'Items', preview: <AccordionStates /> }] },
  { name: 'Collapsible', category: 'Disclosure', description: 'A single expandable panel.', variants: [{ name: 'Closed by default', preview: <CollapsibleStates /> }] },
  { name: 'Tabs', category: 'Navigation', description: 'Switch between related content panels.', variants: [{ name: 'Two tabs', preview: <TabsStates /> }] },
  { name: 'Card and Setting', category: 'Layout', description: 'Polar SettingsGroup: ring, rounded-2xl, row dividers, split/stacked/inline layouts.', variants: [{ name: 'Settings card', preview: <CardStates /> }, { name: 'Setting layouts', preview: <CardLayoutStates /> }, { name: 'Plain card container', preview: <CardPlainStates /> }] },
  { name: 'Stack / Cluster / Container', category: 'Layout', description: 'Polar spacing steps and breakpoint widths: no custom pixels.', variants: [{ name: 'Preset layout composition', preview: <LayoutStates /> }, { name: 'Stack gaps', preview: <StackGapStates /> }, { name: 'Cluster align and wrap', preview: <ClusterAlignStates /> }, { name: 'Container widths', preview: <ContainerWidthStates /> }] },
  { name: 'Banner', category: 'Feedback', description: 'Polar orbit Alert: variant picks icon and accent, optional dismiss and actions.', variants: [{ name: 'Variants', preview: <BannerVariants /> }, { name: 'Dismiss, loading and actions', preview: <BannerInteractions /> }] },
  { name: 'Well', category: 'Layout', description: 'Polar Well: rounded surface for grouped settings and summary blocks.', variants: [{ name: 'Header, content, action', preview: <WellCompositions /> }] },
  { name: 'DetailRow', category: 'Data display', description: 'Polar detail line: muted label, value slot, hover-revealed action.', variants: [{ name: 'Values, mono, empty, action', preview: <DetailRowStates /> }] },
  { name: 'EmptyState', category: 'Feedback', description: 'Polar empty state: bordered panel, large icon, optional actions.', variants: [{ name: 'Icon, actions, fill', preview: <EmptyStateStates /> }] },
  { name: 'StatisticCard', category: 'Data display', description: 'Polar metric tile: muted title over mono value, sm and lg.', variants: [{ name: 'Sizes', preview: <StatisticCardStates /> }] },
  { name: 'Paginator', category: 'Navigation', description: 'Polar paginator: dots algorithm, page pills, arrow controls.', variants: [{ name: 'Dots and plain ranges', preview: <PaginatorStates /> }] },
  { name: 'Dialog', category: 'Feedback', description: 'Modal dialog with fixed Polar sizing.', variants: [{ name: 'Standard dialog', preview: <DialogStates /> }] },
  { name: 'AlertDialog', category: 'Feedback', description: 'Confirmation dialog for consequential actions.', variants: [{ name: 'Destructive confirmation', preview: <AlertDialogStates /> }] },
  { name: 'Tooltip', category: 'Feedback', description: 'Contextual help on hover or focus.', variants: [{ name: 'Tooltip', preview: <TooltipStates /> }] },
];
